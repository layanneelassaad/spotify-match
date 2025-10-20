// backend/routes/spotifyAuth.js
const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
require("dotenv").config();

const router = express.Router();
const redirect_uri = "http://localhost:3000/api/spotify/callback"; // This must match Spotify Developer Console

// Step 1: Redirect user to Spotify to authorize
router.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-library-read"
  ].join(" ");

  const authURL = "https://accounts.spotify.com/authorize?" + querystring.stringify({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri,
  });

  res.redirect(authURL);
});

// Step 2: Spotify redirects back with code -> exchange it for access token
router.post("/callback", async (req, res) => {
  const code = req.body.code;

  if (!code) {
    return res.status(400).json({ error: "Missing Spotify authorization code." });
  }

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log("Spotify token exchange successful");

    // Return to frontend
    return res.json({ access_token, refresh_token, expires_in });
  } catch (err) {
    console.error("❌ Spotify token error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Spotify token exchange failed" });
  }
});

module.exports = router;
