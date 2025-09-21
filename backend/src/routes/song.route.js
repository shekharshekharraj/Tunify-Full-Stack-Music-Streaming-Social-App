import { Router } from "express";
import { getAllSongs, getFeaturedSongs, getMadeForYouSongs, getTrendingSongs } from "../controller/song.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// --- THE FIX IS HERE ---
// Removed 'requireAdmin' so that any logged-in user can fetch songs for the search feature.
// The route is still protected, so only signed-in users can access it.
router.get("/", protectRoute, getAllSongs);
// --- END OF FIX ---

router.get("/featured", getFeaturedSongs);
router.get("/made-for-you", getMadeForYouSongs);
router.get("/trending", getTrendingSongs);

export default router;