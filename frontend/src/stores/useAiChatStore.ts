import { create } from "zustand";

type Msg = { role: "user" | "assistant"; text: string };

type SendArgs = {
  message: string;
  context?: any;
  applyClientInstruction?: (inst: any) => void;
};

const API = import.meta.env.VITE_API_BASE || ""; // leave empty if using Vite proxy

export const useAiChatStore = create<{
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  send: (args: SendArgs) => Promise<void>;
}>((set) => ({
  isOpen: false,
  setOpen: (v) => set({ isOpen: v }),
  messages: [],
  input: "",
  setInput: (v) => set({ input: v }),
  sending: false,

  send: async ({ message, context, applyClientInstruction }) => {
    const trimmed = (message || "").trim();
    if (!trimmed) return;

    set((s) => ({
      messages: [...s.messages, { role: "user", text: trimmed }],
      input: "",
      sending: true,
    }));

    try {
      const url = API ? `${API}/api/ai/chat` : `/api/ai/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, context }),
      });
      const json = await resp.json();

      // 1) Primary assistant line
      if (json?.assistant) {
        set((s) => ({
          messages: [...s.messages, { role: "assistant", text: json.assistant }],
        }));
      }

      // 2) Rich info or lyrics excerpt as a separate bubble
      const extraText: string | undefined =
        json?.actionResult?.assistantOverride ||
        (json?.action?.type === "lyrics_snippet" && json?.actionResult?.lyrics);

      if (extraText && typeof extraText === "string" && extraText.trim().length > 0) {
        set((s) => ({
          messages: [...s.messages, { role: "assistant", text: extraText }],
        }));
      }

      // 3) Apply client instruction (play, queue, pause, etc.)
      if (json?.actionResult?.clientInstruction && applyClientInstruction) {
        applyClientInstruction(json.actionResult.clientInstruction);
      }
    } catch (e) {
      set((s) => ({
        messages: [
          ...s.messages,
          { role: "assistant", text: "I couldn’t process that. Try again." },
        ],
      }));
    } finally {
      set({ sending: false });
    }
  },
}));
