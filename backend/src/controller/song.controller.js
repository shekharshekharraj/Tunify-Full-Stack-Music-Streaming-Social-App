// backend/src/controller/song.controller.js
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { User } from "../models/user.model.js";

/** Utility: pagination */
const paginate = (arr, page = 1, limit = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Math.min(50, Number(limit) || 20));
  const start = (p - 1) * l;
  return {
    results: arr.slice(start, start + l),
    page: p,
    limit: l,
    total: arr.length,
  };
};

// ---------- Public list endpoints ----------
export const getAllSongs = async (_req, res, next) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (e) {
    next(e);
  }
};

export const getFeaturedSongs = async (_req, res, next) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 }).limit(12);
    res.json(songs);
  } catch (e) {
    next(e);
  }
};

export const getMadeForYouSongs = async (_req, res, next) => {
  try {
    const songs = await Song.find().sort({ updatedAt: -1 }).limit(12);
    res.json(songs);
  } catch (e) {
    next(e);
  }
};

export const getTrendingSongs = async (_req, res, next) => {
  try {
    // Sorting by likes length and recency (approx)
    const songs = await Song.find().sort({ createdAt: -1 }).limit(100);
    const ranked = songs
      .map(s => ({ s, score: (s.likes?.length || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(x => x.s);
    res.json(ranked);
  } catch (e) {
    next(e);
  }
};

// ---------- Likes ----------
export const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params; // song id
    const clerkId = req.auth?.userId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    const i = song.likes.indexOf(clerkId);
    let action = "liked";
    if (i === -1) song.likes.push(clerkId);
    else {
      song.likes.splice(i, 1);
      action = "unliked";
    }

    await song.save();
    res.json({ action, likesCount: song.likes.length, likes: song.likes });
  } catch (e) {
    next(e);
  }
};

// ---------- Comments ----------
export const listComments = async (req, res, next) => {
  try {
    const { id } = req.params; // song id
    const { page = 1, limit = 20 } = req.query;

    const song = await Song.findById(id).populate({
      path: "comments.user",
      select: "_id fullName imageUrl clerkId",
      model: User,
    });
    if (!song) return res.status(404).json({ message: "Song not found" });

    const sorted = [...song.comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const { results, ...meta } = paginate(sorted, page, limit);
    res.json({ comments: results, ...meta });
  } catch (e) {
    next(e);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params; // song id
    const { text } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    // Create, save, then populate via the parent doc
    const newComment = { user: user._id, text: String(text).trim() };
    song.comments.unshift(newComment);
    await song.save();

    const createdId = song.comments[0]._id;

    // ✅ Populate nested via the parent (Mongoose requires dotted path)
    await song.populate({
      path: "comments.user",
      select: "_id fullName imageUrl clerkId",
      model: User,
    });

    const created = song.comments.id(createdId);
    return res.status(201).json({ comment: created, count: song.comments.length });
  } catch (e) {
    next(e);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const clerkId = req.auth?.userId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const song = await Song.findById(id).populate({
      path: "comments.user",
      select: "_id clerkId",
      model: User,
    });
    if (!song) return res.status(404).json({ message: "Song not found" });

    const index = song.comments.findIndex((c) => String(c._id) === String(commentId));
    if (index === -1) return res.status(404).json({ message: "Comment not found" });

    const comment = song.comments[index];
    const envId = (process.env.ADMIN_CLERK_ID || "").trim();
    const isOwner = comment.user?.clerkId === clerkId;
    const isAdmin = envId && envId === clerkId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    song.comments.splice(index, 1);
    await song.save();
    res.json({ deleted: true, count: song.comments.length });
  } catch (e) {
    next(e);
  }
};
