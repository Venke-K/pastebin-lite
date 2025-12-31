const express = require("express");
const crypto = require("node:crypto");
const redis = require("../utils/redis.js");
const { getNow } = require("../utils/time.js");

const router = express.Router();

//POST  API //
router.post("/", async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  // Validating content //
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "content is required" });
  }

  // Validating ttl_seconds //
  if (
    ttl_seconds !== undefined &&
    (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
  ) {
    return res
      .status(400)
      .json({ error: "ttl_seconds must be an integer >= 1" });
  }

  // Validating max_views //
  if (
    max_views !== undefined &&
    (!Number.isInteger(max_views) || max_views < 1)
  ) {
    return res.status(400).json({ error: "max_views must be an integer >= 1" });
  }

  const id = crypto.randomUUID();
  const now = getNow(req);
  const expires_at = ttl_seconds ? now + ttl_seconds * 1000 : null;

  const pasteData = {
    id,
    content,
    expires_at,
    max_views: max_views ?? null,
    views: 0,
  };

  // Store once — Redis TTL is the source of truth
  if (ttl_seconds) {
    await redis.set(`paste:${id}`, JSON.stringify(pasteData), {
      ex: ttl_seconds,
    });
  } else {
    await redis.set(`paste:${id}`, JSON.stringify(pasteData));
  }

  res.status(201).json({
    id,
    url: `${req.protocol}://${req.get("host")}/p/${id}`,
  });
});

//GET API //
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const raw = await redis.get(`paste:${id}`);
  if (!raw) {
    return res.status(404).json({ error: "Paste not found" });
  }

  const paste = typeof raw === "string" ? JSON.parse(raw) : raw;

  // Enforce view limit ONLY if enabled
  if (paste.max_views !== null) {
    if (paste.views >= paste.max_views) {
      return res.status(404).json({ error: "View limit exceeded" });
    }

    paste.views += 1;

    // Update Redis ONLY because views changed
    await redis.set(`paste:${id}`, JSON.stringify(paste));
  }

  res.status(200).json({
    content: paste.content,
    remaining_views:
      paste.max_views === null ? null : paste.max_views - paste.views,
    expires_at: paste.expires_at
      ? new Date(paste.expires_at).toISOString()
      : null,
  });
});

module.exports = router;
