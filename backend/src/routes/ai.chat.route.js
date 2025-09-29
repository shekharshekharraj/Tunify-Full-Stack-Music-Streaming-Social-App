// backend/src/routes/ai.chat.route.js
import { Router } from "express";
import { aiChatHandler } from "../controller/ai.chat.controller.js";

const router = Router();
router.post("/chat", aiChatHandler);
export default router;
