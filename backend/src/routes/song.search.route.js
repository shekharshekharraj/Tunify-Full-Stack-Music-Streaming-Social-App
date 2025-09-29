// backend/src/routes/song.search.route.js
import { Router } from "express";
// If your folder is "modals", change to "../modals/song.model.js"
import {Song} from "../models/song.model.js";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ songs: [] });

    const songs = await Song.find({
      $or: [
        { title:  { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
      ],
    })
      .limit(10)
      .lean();

    res.json({
      songs: songs.map((s) => ({
        _id: String(s._id),
        title: s.title,
        artist: s.artist || "",
        imageUrl: s.imageUrl || "",
        audioUrl: s.audioUrl || "",   // Cloudinary direct URL
        duration: s.duration || undefined,
      })),
    });
  } catch (err) {
    console.error("GET /api/songs/search error:", err);
    res.status(500).json({ songs: [], error: "search_failed" });
  }
});

export default router;
