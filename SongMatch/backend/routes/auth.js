const express = require("express");
const admin = require("../firebaseAdmin");
const db = require("../services/db");

const router = express.Router(); 

router.post("/verify", async (req, res) => {
  console.log(" /api/auth/verify HIT");
  console.log(" Request body:", req.body);

  const { token } = req.body;

  if (!token) {
    console.warn(" No token provided in body!");
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email, picture } = decodedToken;

    console.log("Verified user:", { uid, name, email });

    await db.updateUser(uid, { name, email, picture });

    return res.json({ uid, name, email, picture });
  } catch (err) {
    console.error(" Token verification failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
