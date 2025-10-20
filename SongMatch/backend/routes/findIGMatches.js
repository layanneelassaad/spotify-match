// backend/routes/findIGMatches.js

const express = require("express");
const router = express.Router();
const db = require("../services/db");

router.post("/", async (req, res) => {
  const handles = req.body.handles.map((h) => h.toLowerCase());
  const matchedUsers = await db.findUsersByInstagram(handles);
  res.json(matchedUsers);
});

module.exports = router;
