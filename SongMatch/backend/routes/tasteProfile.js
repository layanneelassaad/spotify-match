const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/taste-profile", async (req, res) => {
  const accessToken = req.headers["spotify-access-token"];
  const { uid } = req.body;

  if (!accessToken || !uid) {
    return res.status(400).json({ error: "Missing access token or uid" });
  }

  try {
    const artistRes = await fetch("https://api.spotify.com/v1/me/top/artists?limit=50", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const artistData = await artistRes.json();

    const trackRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const trackData = await trackRes.json();

    const genres = [...new Set(artistData.items.flatMap((a) => a.genres))];

    const profile = {
      uid,
      topArtistIds: artistData.items.map((a) => a.id),
      topArtistNames: artistData.items.map((a) => a.name),
      genres,
      topTrackIds: trackData.items.map((t) => t.id),
      topTrackNames: trackData.items.map((t) => t.name),
      trackPopularity: trackData.items.map((t) => t.popularity),
    };

    // --------- 🔢 Build Taste Vector ---------
    const allGenres = ["pop", "rock", "rap", "indie", "r&b", "hip hop", "metal", "jazz", "classical", "house", "electronic", "folk"]; // Extendable

    const genreVector = allGenres.map((g) => (genres.includes(g) ? 1 : 0));
    const popularityVector = profile.trackPopularity.slice(0, 10); // fixed length

    const tasteVector = [...genreVector, ...popularityVector];

    profile.tasteVector = tasteVector;
    // -----------------------------------------

    const profilesDir = path.join(__dirname, "../profiles");
    if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir);

    fs.writeFileSync(
      path.join(profilesDir, `${uid}.json`),
      JSON.stringify(profile, null, 2)
    );

    console.log(`Saved taste profile for user ${uid}`);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("❌ Error generating taste profile:", err);
    res.status(500).json({ error: "Internal error generating taste profile" });
  }
});

module.exports = router;
