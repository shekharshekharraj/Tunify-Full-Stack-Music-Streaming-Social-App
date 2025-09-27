// backend/src/routes/song.route.js
import { Router } from "express";
import {
  getAllSongs,
  getFeaturedSongs,
  getMadeForYouSongs,
  getTrendingSongs,
  toggleLike,
  listComments,
  addComment,
  deleteComment,
} from "../controller/song.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// public reads
router.get("/", getAllSongs);
router.get("/featured", getFeaturedSongs);
router.get("/made-for-you", getMadeForYouSongs);
router.get("/trending", getTrendingSongs);

// likes
router.post("/:id/like", protectRoute, toggleLike);

// comments
router.get("/:id/comments", listComments);            // public read is ok
router.post("/:id/comments", protectRoute, addComment);
router.delete("/:id/comments/:commentId", protectRoute, deleteComment);

export default router;
