// backend/middleware/authMiddleware.js
const admin = require("../firebaseAdmin");

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Firebase token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyFirebaseToken;
