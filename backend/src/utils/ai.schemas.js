// backend/src/utils/ai.schemas.js
import { z } from "zod";

// === Structured actions the model can output ===
export const AiActionResponseSchema = z.discriminatedUnion("type", [
  // Core music controls
  z.object({ type: z.literal("play_song"), query: z.string().min(1) }),
  z.object({ type: z.literal("queue_song"), query: z.string().min(1) }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("resume") }),
  z.object({ type: z.literal("play_next") }),
  z.object({ type: z.literal("play_previous") }),
  z.object({ type: z.literal("whats_playing") }),

  // UI/Player toggles
  z.object({ type: z.literal("toggle_lyrics"), on: z.boolean().optional() }),
  z.object({ type: z.literal("set_volume"), value: z.number().min(0).max(100) }),
  z.object({ type: z.literal("set_repeat"), mode: z.enum(["off", "queue", "one"]) }),

  // Discovery
  z.object({
    type: z.literal("recommend_songs"),
    mood: z.string().optional(),
    filters: z.record(z.any()).optional(),
  }),

  // Playlist ops (server stubs)
  z.object({ type: z.literal("create_playlist"), theme: z.string().min(1).optional() }),
  z.object({
    type: z.literal("add_to_playlist"),
    playlistName: z.string().min(1),
    query: z.string().min(1),
  }),

  // Info intents (queries optional for follow-ups)
  z.object({ type: z.literal("song_info"), query: z.string().min(1).optional() }),
  z.object({
    type: z.literal("artist_info"),
    artist: z.string().optional(),
    query: z.string().optional(),
  }),
  z.object({ type: z.literal("lyrics_snippet"), query: z.string().min(1).optional() }),

  // Trivia / facts
  z.object({ type: z.literal("artist_fact"), artist: z.string().optional() }),

  // Fallback
  z.object({ type: z.literal("none") }),
]);

export function buildSystemPrompt(languageHint) {
  return `You are "Tunify AI Companion", a concise, helpful in-app music assistant.

STRICT OUTPUT FORMAT — ALWAYS return EXACTLY TWO fenced blocks in this order:
1) \`\`\`
<assistant_message_markdown in ${languageHint || "the user's language"}>
\`\`\`
2) \`\`\`json
{"type":"<one of: play_song, queue_song, pause, resume, play_next, play_previous, whats_playing, toggle_lyrics, set_volume, set_repeat, recommend_songs, create_playlist, add_to_playlist, song_info, artist_info, lyrics_snippet, artist_fact, none>", ...fields}
\`\`\`

Rules:
- Never omit the JSON block. No text before/after the two blocks.
- Assistant message: ≤ 3 short sentences; use bullets only when listing info.
- If the user says "show lyrics", use {"type":"lyrics_snippet"} (do NOT use toggle_lyrics).
- For "this/that song" without a title, you may omit the query; the server will infer from context/memory.
- For "this/that artist" without a name, set {"type":"artist_info"} without artist; the server will infer.
- If unsure, use {"type":"none"} but still output the JSON block.`;
}
