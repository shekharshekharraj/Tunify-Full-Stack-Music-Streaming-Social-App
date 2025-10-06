// backend/src/routes/ytmusic.route.js
import { Router } from "express";
import {
  ytSearchHandler,
  ytSuggestHandler,
  ytLyricsHandler,
  ytEmbedHandler,
} from "../controller/ytmusic.controller.js";

const router = Router();

router.get("/search", ytSearchHandler);
router.get("/suggest", ytSuggestHandler);
router.get("/lyrics", ytLyricsHandler);
router.get("/embed", ytEmbedHandler);

export default router;
