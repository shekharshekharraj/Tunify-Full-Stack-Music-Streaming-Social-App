// backend/routes/user.route.js
import { Router } from "express";
import {
  getAllUsers,
  getMessages,
  toggleFollow,
  getCurrentUser,
} from "../controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// define /me before dynamic params
router.get("/me", protectRoute, getCurrentUser);

router.get("/", protectRoute, getAllUsers);
router.get("/messages/:userId", protectRoute, getMessages);
router.post("/toggle-follow/:targetUserClerkId", protectRoute, toggleFollow);

export default router;
