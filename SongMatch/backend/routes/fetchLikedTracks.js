const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

router.get("/liked-tracks", async (req, res) => {
  const accessToken = req.headers["spotify-access-token"];

  if (!accessToken) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const allTracks = [];
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore && offset < 1000) { // limit to 1000 to avoid long load
      const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();

      const items = data.items || [];
      allTracks.push(...items.map(item => item.track.id));
      offset += items.length;
      hasMore = items.length === 50;
    }

    res.status(200).json({ likedTrackIds: allTracks });
  } catch (err) {
    console.error("❌ Error fetching liked tracks:", err);
    res.status(500).json({ error: "Failed to fetch liked tracks" });
  }
});

module.exports = router;
