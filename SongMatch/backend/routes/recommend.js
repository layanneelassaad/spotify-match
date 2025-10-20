const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB || 1);
}

router.post("/recommend", (req, res) => {
  const { uid, likedTrackIds: rawLikedIds } = req.body;

  const likedTrackIds = new Set((rawLikedIds || []).map(String)); // ✅ moved inside

  const profilePath = path.join(__dirname, "..", "profiles", `${uid}.json`);
  if (!fs.existsSync(profilePath)) {
    return res.status(404).json({ error: "User profile not found" });
  }

  const currentProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
  const currentVector = currentProfile.tasteVector;

  const userTopTracks = new Set((currentProfile.topTrackIds || []).map(String));

  const allProfilesDir = path.join(__dirname, "..", "profiles");
  const allFiles = fs.readdirSync(allProfilesDir).filter((f) => f !== `${uid}.json`);

  const similarities = [];

  for (const file of allFiles) {
    const otherProfile = JSON.parse(fs.readFileSync(path.join(allProfilesDir, file), "utf-8"));
    if (!otherProfile.tasteVector || otherProfile.tasteVector.length !== currentVector.length) continue;

    const sim = cosineSimilarity(currentVector, otherProfile.tasteVector);
    similarities.push({ sim, profile: otherProfile });
  }

  similarities.sort((a, b) => b.sim - a.sim);
  const topMatches = similarities.slice(0, 10);

  const trackScores = {};

  for (const { sim, profile } of topMatches) {
    const trackIds = profile.topTrackIds || [];
    const trackNames = profile.topTrackNames || [];

    for (let i = 0; i < trackIds.length; i++) {
      const trackId = String(trackIds[i]);
      if (userTopTracks.has(trackId)) {
        console.log(`Skipped ${trackId} — in top tracks`);
      } else if (likedTrackIds.has(trackId)) {
        console.log(`Skipped ${trackId} — in liked tracks`);
      }

      if (!userTopTracks.has(trackId) && !likedTrackIds.has(trackId)) {
        if (!trackScores[trackId]) {
          trackScores[trackId] = {
            name: trackNames[i] || "Unknown",
            score: 0,
            count: 0,
            external_url: `https://open.spotify.com/track/${trackId}`,
          };
        }
        trackScores[trackId].score += sim;
        trackScores[trackId].count += 1;
      } else {
        console.log(`Skipping ${trackId} (${trackNames[i]}) — already liked`);
      }
    }
  }

  const recommendedTracks = Object.entries(trackScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 10)
    .map(([id, { name, score, count, external_url }]) => ({
      id,
      name,
      score: score.toFixed(3),
      count,
      external_url,
    }));

  console.log("Final Recommendations:", recommendedTracks.map(r => r.name));

  return res.status(200).json({ recommendations: recommendedTracks });
});

module.exports = router;
