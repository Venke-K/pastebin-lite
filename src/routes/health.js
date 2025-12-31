const express = require("express");
const redis = require("../utils/redis.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await redis.ping();
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "redis unavailable",
    });
  }
});

module.exports = router;
