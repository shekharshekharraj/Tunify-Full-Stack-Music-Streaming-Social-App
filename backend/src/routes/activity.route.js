// backend/routes/activity.route.js
import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getFeed, logSongListen } from "../controller/activity.controller.js";

const router = Router();

router.post("/log-listen", protectRoute, logSongListen);
router.get("/feed", protectRoute, getFeed);

export default router;
