const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Make sure this is near the top

// Routes
const authRoutes = require("./routes/auth");
const spotifyAuthRoutes = require("./routes/spotifyAuth");
const matchRoutes = require("./routes/match");
const instagramRoutes = require("./routes/instagram");
const recommendRoutes = require("./routes/recommend");
const contactsRoutes = require("./routes/contacts");
const likedTracksRoutes = require("./routes/fetchLikedTracks");



const app = express();
const PORT = process.env.PORT || 5050;
const spotifyDataRoutes = require("./routes/spotifyData");

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// CORS configuration (safe and complete)
app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Spotify-Access-Token", "Spotify-UID"],
    })
  );
app.use(express.json());
app.use("/api/spotify", spotifyDataRoutes);
app.use("/api", recommendRoutes);

const tasteProfileRoutes = require("./routes/tasteProfile");

app.use("/api", likedTracksRoutes);
app.use("/api", tasteProfileRoutes);  // handles /taste-profile
app.use("/api", matchRoutes);         // handles /find-matches
// Logging
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

// JSON body parsing


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/spotify", spotifyAuthRoutes); // Spotify route included
app.use("/api/match", matchRoutes);
app.use("/api/instagram", instagramRoutes);

app.use("/api/contacts", contactsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
