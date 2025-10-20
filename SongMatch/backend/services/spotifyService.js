// backend/services/spotifyService.js
const axios = require("axios");

async function getTopTracks(accessToken) {
  const response = await axios.get("https://api.spotify.com/v1/me/top/tracks?limit=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data.items;
}

async function getAudioFeatures(trackIds, accessToken) {
  const response = await axios.get(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data.audio_features;
}

module.exports = { getTopTracks, getAudioFeatures };
