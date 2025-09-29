// backend/src/controllers/ai.chat.controller.js
import { z } from "zod";
import { runAiChat } from "../services/ai.chat.service.js";
import { dispatchAiAction } from "../services/ai.action-dispatcher.js";
import { AiActionResponseSchema } from "../utils/ai.schemas.js";
import { appendHistory, getLastResolvedSong } from "../services/ai.memory.service.js";

const BodySchema = z.object({
  message: z.string().min(1),
  context: z
    .object({
      recent: z
        .array(
          z.object({
            title: z.string(),
            artist: z.string().optional(),
            id: z.string().optional(),
          })
        )
        .optional(),
      nowPlaying: z
        .object({
          title: z.string(),
          artist: z.string().optional(),
          id: z.string().optional(),
        })
        .optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// -------- Heuristic helpers --------
function trimVerbPrefix(original) {
  const s = String(original || "");
  const m = s.match(/^\s*(?:please\s+)?(?:play|queue|add(?:\s+to)?\s+queue)\s+(.+)$/i);
  return m?.[1]?.trim() || s.trim();
}

function heuristicInfo(originalMessage) {
  const msg = String(originalMessage || "");
  const lower = msg.toLowerCase().trim();

  if (/^(duration|length)\b/.test(lower) || /duration of\b/i.test(lower)) return { type: "song_info" };
  if (/^(what(('| i))?s playing|what is playing)/i.test(lower)) return { type: "whats_playing" };
  if (/(tell me about|details? (of|about)|info (on|about))/i.test(lower)) return { type: "song_info" };
  if (/^(who (sang|is the singer)|artist( of)? (this|that)?)\b/i.test(lower)) return { type: "artist_info" };
  if (/^(lyrics|show lyrics|lyrics of|lyrics for)/i.test(lower)) return { type: "lyrics_snippet" };

  return { type: "none" };
}

function heuristicIntent(originalMessage) {
  const msg = String(originalMessage || "");
  const lower = msg.toLowerCase();
  if (/^\s*(?:please\s+)?play\b/.test(lower)) return { type: "play_song", query: trimVerbPrefix(msg) };
  if (/^\s*(?:please\s+)?queue\b/.test(lower)) return { type: "queue_song", query: trimVerbPrefix(msg) };
  if (/^\s*(?:pause|stop)\b/.test(lower)) return { type: "pause" };
  if (/^\s*(?:resume|continue)\b/.test(lower)) return { type: "resume" };
  if (/^\s*(?:next|skip)\b/.test(lower)) return { type: "play_next" };
  if (/^\s*(?:previous|back)\b/.test(lower)) return { type: "play_previous" };
  return heuristicInfo(originalMessage);
}

export async function aiChatHandler(req, res) {
  try {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "Invalid payload", issues: parsed.error.flatten() });
    }

    const userId = req.user?.id || req.auth?.userId || "anonymous";
    const { message, context } = parsed.data || {};

    appendHistory(userId, "user", message);

    const ai = await runAiChat({ userId, message, context });

    // Prefer model-structured action; fallback to heuristics
    let action;
    const parsedAction = AiActionResponseSchema.safeParse(ai.structured);
    action = parsedAction.success ? parsedAction.data : { type: "none" };
    if (!action || action.type === "none") action = heuristicIntent(message);

    // -------- Context & memory inference for info intents --------
    const last = getLastResolvedSong(userId);
    const nowPlayingTitle = context?.nowPlaying?.title;
    const nowPlayingArtist = context?.nowPlaying?.artist;

    // Fill missing query for song-level info
    if ((action.type === "song_info" || action.type === "lyrics_snippet") && !action.query) {
      if (last?.title) action.query = last.title;
      else if (nowPlayingTitle) action.query = nowPlayingTitle;
    }

    // Fill missing artist for artist-level info
    if (action.type === "artist_info" && !action.artist) {
      if (last?.artist) action.artist = last.artist;
      else if (nowPlayingArtist) action.artist = nowPlayingArtist;
    }

    // -------- Special nudge: “show lyrics” should prefer text (lyrics_snippet) --------
    if (/(^|\b)show\s+(the\s+)?lyrics(\b|$)/i.test(message)) {
      const inferredTitle = last?.title || nowPlayingTitle;
      if (inferredTitle) {
        action = { type: "lyrics_snippet", query: inferredTitle };
      } else if (action.type !== "lyrics_snippet") {
        // still force the type so frontend gets a snippet (server will say none if unresolved)
        action = { type: "lyrics_snippet" };
      }
    }

    const actionResult = await dispatchAiAction({ userId, action });

    appendHistory(userId, "assistant", ai.assistantText);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[/api/ai/chat] action:",
        action,
        "result:",
        actionResult?.clientInstruction || actionResult?.serverEffect
      );
    }

    return res.status(200).json({ ok: true, assistant: ai.assistantText, action, actionResult });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("/api/ai/chat error:", msg);
    const dev = process.env.NODE_ENV !== "production";
    return res.status(500).json({ ok: false, message: dev ? `Chat failed: ${msg}` : "Chat failed" });
  }
}
