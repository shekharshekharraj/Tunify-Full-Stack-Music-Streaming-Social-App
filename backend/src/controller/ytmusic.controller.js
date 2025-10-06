// backend/src/controllers/ytmusic.controller.js
import { ytSearch, ytSuggestions, ytLyrics } from "../services/ytmusic.service.js";

/**
 * GET /api/yt/search?q=believer&type=songs
 */
export async function ytSearchHandler(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    const type = (req.query.type || "songs").trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10) || 20, 1), 50);
    if (!q) return res.status(400).json({ ok: false, message: "q is required" });

    const results = await ytSearch({ q, type, limit });
    res.json({ ok: true, results });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/yt/suggest?q=bel
 */
export async function ytSuggestHandler(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ ok: false, message: "q is required" });
    const suggestions = await ytSuggestions(q);
    res.json({ ok: true, suggestions });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/yt/lyrics?id=VIDEO_ID
 */
export async function ytLyricsHandler(req, res, next) {
  try {
    const id = (req.query.id || "").trim();
    if (!id) return res.status(400).json({ ok: false, message: "id is required" });
    const lyr = await ytLyrics(id);
    res.json({ ok: true, lyrics: lyr || null });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/yt/embed?id=VIDEO_ID
 * Returns a safe embed URL for the front-end.
 */
export async function ytEmbedHandler(req, res) {
  const id = (req.query.id || "").trim();
  if (!id) return res.status(400).json({ ok: false, message: "id is required" });

  const origin = req.headers.origin || "";
  const base = `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
  // enablejsapi=1 -> allows basic JS control if you want later
  const url = `${base}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
  res.json({ ok: true, url, id });
}
