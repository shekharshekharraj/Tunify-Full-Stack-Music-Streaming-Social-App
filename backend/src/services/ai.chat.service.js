// backend/src/services/ai.chat.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "../utils/ai.schemas.js";
import { getUserMem } from "./ai.memory.service.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function runAiChat({ userId, message, context }) {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error("Missing GOOGLE_AI_API_KEY");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const mem = getUserMem(userId);
  const hist = (mem.history || []).map((h) => `- ${h.role.toUpperCase()}: ${h.text}`).join("\n");

  const now = context?.nowPlaying
    ? `Now playing: ${context.nowPlaying.title}${context.nowPlaying.artist ? " — " + context.nowPlaying.artist : ""}`
    : "Now playing: (none)";

  const recent = (context?.recent || [])
    .slice(0, 10)
    .map((s, i) => `${i + 1}. ${s.title}${s.artist ? " — " + s.artist : ""}`)
    .join("\n");

  const system = buildSystemPrompt(context?.language);
  const userBlock =
`USER MESSAGE:
${message}

APP CONTEXT:
${now}
Recent plays:
${recent || "(none)"}

CONVERSATION MEMORY (most recent first):
${hist || "(none)"}
`;

  const prompt = `${system}\n${userBlock}`;

  const resp = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const fullText = resp?.response?.text?.() || "";

  const blocks = Array.from(fullText.matchAll(/```(json)?\n([\s\S]*?)```/g)).map(m => m[2].trim());
  let assistantText = "";
  let structured = { type: "none" };

  if (blocks.length >= 2) {
    assistantText = blocks[0];
    try { structured = JSON.parse(blocks[1]); } catch {}
  } else if (blocks.length === 1) {
    try { structured = JSON.parse(blocks[0]); } catch { assistantText = blocks[0]; }
  } else {
    assistantText = fullText.replace(/```[\s\S]*?```/g, "").trim();
    const jsonish = fullText.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/m, "$1");
    try { structured = JSON.parse(jsonish); } catch {}
  }

  assistantText = (assistantText || "Here you go.").slice(0, 1000);
  return { assistantText, structured };
}
