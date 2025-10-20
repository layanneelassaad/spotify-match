// backend/routes/contacts.js

// backend/routes/contacts.js

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../services/db");

function sha256(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

router.post("/contacts", async (req, res) => {
  const contacts = req.body.emails.map(email => sha256(email));
  const matchedUsers = await db.findUsersByHashedEmails(contacts);
  res.json(matchedUsers);
});

module.exports = router;
