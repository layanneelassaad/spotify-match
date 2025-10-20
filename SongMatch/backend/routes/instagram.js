const express = require("express");
const router = express.Router();
const db = require("../services/db");

router.post("/instagram-handle", async (req, res) => {
  const { userId, handle } = req.body;
  await db.updateUser(userId, { igHandle: handle.toLowerCase() });
  res.sendStatus(200);
});

module.exports = router;
