const express = require("express");
const fs = require("fs");
const path = require("path");

const matchRouter = express.Router();

/**
 * Compute similarity score between two user profiles and return breakdown.
 */
function computeSimilarityScore(a, b) {
  const WEIGHTS = {
    artists: 35,
    tracks: 25,
    genres: 20,
    popularity: 20,
  };

  // Maps for name lookups
  const aArtistMap = Object.fromEntries(a.topArtistIds.map((id, i) => [id, a.topArtistNames?.[i]]));
  const bArtistMap = Object.fromEntries(b.topArtistIds.map((id, i) => [id, b.topArtistNames?.[i]]));

  const aTrackMap = Object.fromEntries(a.topTrackIds.map((id, i) => [id, a.topTrackNames?.[i]]));
  const bTrackMap = Object.fromEntries(b.topTrackIds.map((id, i) => [id, b.topTrackNames?.[i]]));

  // Shared Artists
  const sharedArtistIds = a.topArtistIds.filter((id) => b.topArtistIds.includes(id));
  const sharedArtistNames = sharedArtistIds.map((id) => aArtistMap[id] || bArtistMap[id] || id);

  // Shared Tracks
  const sharedTrackIds = a.topTrackIds.filter((id) => b.topTrackIds.includes(id));
  const sharedTrackNames = sharedTrackIds.map((id) => aTrackMap[id] || bTrackMap[id] || id);

  // Shared Genres
  const genreSetA = new Set(a.genres);
  const genreSetB = new Set(b.genres);
  const sharedGenres = [...genreSetA].filter((g) => genreSetB.has(g));
  const genreUnion = new Set([...a.genres, ...b.genres]);
  const genreSimilarity = genreUnion.size ? sharedGenres.length / genreUnion.size : 0;

  // Popularity Similarity (Cosine)
  const popA = a.trackPopularity;
  const popB = b.trackPopularity;
  const len = Math.min(popA.length, popB.length);
  const dot = popA.slice(0, len).reduce((acc, v, i) => acc + v * popB[i], 0);
  const magA = Math.sqrt(popA.slice(0, len).reduce((acc, v) => acc + v ** 2, 0));
  const magB = Math.sqrt(popB.slice(0, len).reduce((acc, v) => acc + v ** 2, 0));
  const cosine = dot / (magA * magB || 1);

  // Scores
  const artistScore = (sharedArtistIds.length / 10) * WEIGHTS.artists;
  const trackScore = (sharedTrackIds.length / 10) * WEIGHTS.tracks;
  const genreScore = genreSimilarity * WEIGHTS.genres;
  const popularityScore = cosine * WEIGHTS.popularity;

  const totalScore = artistScore + trackScore + genreScore + popularityScore;

  return {
    totalScore,
    breakdown: {
      artistScore,
      trackScore,
      genreScore,
      popularityScore,
      sharedArtists: sharedArtistNames,
      sharedTracks: sharedTrackNames,
      sharedGenres,
      cosineSimilarity: cosine,
    },
  };
}


/**
 * Load Spotify profile metadata (name, email, picture)
 */
function loadSpotifyProfile(uid) {
  const file = path.join(__dirname, "..", "spotify-profiles", `${uid}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return {
      name: data.display_name || "Spotify User",
      email: data.email || "",
      picture: data.images?.[0]?.url || "",
    };
  }
  return { name: "Unknown", email: "", picture: "" };
}

/**
 * POST /api/find-matches
 */
matchRouter.post("/find-matches", (req, res) => {
  const { uid } = req.body;
  const profilePath = path.join(__dirname, "..", "profiles", `${uid}.json`);

  if (!fs.existsSync(profilePath)) {
    return res.status(404).json({ error: "User profile not found" });
  }

  const currentProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));

  const allFiles = fs
    .readdirSync(path.join(__dirname, "..", "profiles"))
    .filter((f) => f !== `${uid}.json` && f.endsWith(".json"));

  const matches = allFiles.map((file) => {
    const otherProfile = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "profiles", file), "utf-8")
    );
    const otherUid = file.replace(".json", "");
    const userInfo = loadSpotifyProfile(otherUid);

    const { totalScore, breakdown } = computeSimilarityScore(currentProfile, otherProfile);

    return {
      uid: otherUid,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      score: totalScore,
      breakdown,
    };
  });

  matches.sort((a, b) => b.score - a.score);

  res.status(200).json(matches.slice(0, 5));
});

module.exports = matchRouter;
