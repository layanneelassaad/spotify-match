const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Helper function to safely parse JSON
async function safeJsonParse(response) {
  const text = await response.text();
  try {
    return { json: JSON.parse(text), raw: text };
  } catch (err) {
    return { json: null, raw: text };
  }
}

// GET Spotify Profile
router.get("/profile", async (req, res) => {
  const accessToken = req.headers["spotify-access-token"];
  const uid = req.headers["spotify-uid"];
  console.log("Received Spotify token from frontend:", accessToken);
  console.log("User UID:", uid);

  if (!accessToken || !uid) {
    return res.status(401).json({ error: "Missing Spotify access token or UID" });
  }

  try {
    const spotifyRes = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { json: data, raw } = await safeJsonParse(spotifyRes);
    console.log("Raw Spotify /me response:", raw);

    if (!spotifyRes.ok) {
      return res.status(spotifyRes.status).json({ error: data?.error || raw });
    }

    // Embed UID in the profile data
    data.uid = uid;

    // Save the Spotify profile to a file
    const dir = path.join(__dirname, "..", "spotify-profiles");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    fs.writeFileSync(path.join(dir, `${uid}.json`), JSON.stringify(data, null, 2));
    console.log(`Saved Spotify profile for ${uid}`);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching Spotify profile:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET User's Top Tracks
router.get("/top-tracks", async (req, res) => {
  const accessToken = req.headers["spotify-access-token"];
  console.log("Received Spotify token from frontend:", accessToken);

  if (!accessToken) {
    return res.status(401).json({ error: "Missing Spotify access token" });
  }

  try {
    const topTracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { json: topTracks, raw } = await safeJsonParse(topTracksRes);
    console.log("Raw Spotify /top-tracks response:", raw);

    if (!topTracksRes.ok) {
      return res.status(topTracksRes.status).json({ error: topTracks?.error || raw });
    }

    const cleanedTracks = topTracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      image: track.album.images?.[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
    }));

    return res.status(200).json(cleanedTracks);
  } catch (err) {
    console.error("Error fetching top tracks:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET Audio Features
router.get("/audio-features", async (req, res) => {
  const accessToken = req.headers["spotify-access-token"];
  const ids = req.query.ids;

  if (!accessToken || !ids) {
    return res.status(400).json({ error: "Missing access token or track IDs" });
  }

  try {
    const audioRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { json: audioData, raw } = await safeJsonParse(audioRes);
    console.log("Raw Spotify /audio-features response:", raw);

    if (!audioRes.ok) {
      return res.status(audioRes.status).json({ error: audioData?.error || raw });
    }

    return res.status(200).json(audioData);
  } catch (err) {
    console.error("Error fetching audio features:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
