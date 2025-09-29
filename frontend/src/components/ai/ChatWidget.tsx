// frontend/src/components/ai/ChatWidget.tsx
import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles} from "lucide-react";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/** Suggestion chip button */
function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30
                 bg-zinc-900/60 px-4 py-2 text-[14px] text-zinc-200 hover:border-emerald-400/60
                 hover:bg-zinc-800/60 hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}

export default function ChatWidget() {
  const { isOpen, setOpen, sending, messages, input, setInput, send } = useAiChatStore();
  const {
    currentSong,
    recent,
    playSong,
    queueSong,
    playNext,
    playPrevious,
    toggleLyrics,
    toggleRepeatMode,
    audioNodes,
  } = usePlayerStore() as any;

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const resolveSongClient = async (q: string, fallback?: any) => {
    try {
      const url = API_BASE
        ? `${API_BASE}/api/songs/search?q=${encodeURIComponent(q)}`
        : `/api/songs/search?q=${encodeURIComponent(q)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`search ${r.status}`);
      const data = await r.json();
      const song = data?.songs?.[0];
      return song || fallback || null;
    } catch {
      return fallback || null;
    }
  };

  const applyClientInstruction = async (inst: any) => {
    if (!inst) return;

    switch (inst.type) {
      case "play_song": {
        let song = inst.payload;
        const guessQuery = inst?.query || song?.title || song?.name;
        if ((!song || !song.audioUrl) && guessQuery) song = await resolveSongClient(guessQuery, song);
        if (song) await playSong(song);
        break;
      }
      case "queue_song": {
        let song = inst.payload;
        const guessQuery = inst?.query || song?.title || song?.name;
        if ((!song || !song.audioUrl) && guessQuery) song = await resolveSongClient(guessQuery, song);
        if (song) queueSong(song);
        break;
      }
      case "pause": {
        const audio: HTMLAudioElement | null =
          audioNodes?.audioElement ?? (document.getElementById("global-audio") as any);
        if (audio) audio.pause();
        break;
      }
      case "resume": {
        const audio: HTMLAudioElement | null =
          audioNodes?.audioElement ?? (document.getElementById("global-audio") as any);
        if (audio) { try { await audio.play(); } catch {} }
        break;
      }
      case "play_next":     playNext(); break;
      case "play_previous": playPrevious(); break;
      case "whats_playing": break;
      case "toggle_lyrics": toggleLyrics(); break;
      case "set_volume": {
        const v = Math.max(0, Math.min(100, Number(inst.payload?.value ?? 50)));
        const audio: HTMLAudioElement | null =
          audioNodes?.audioElement ?? (document.getElementById("global-audio") as any);
        if (audio) audio.volume = v / 100;
        break;
      }
      case "set_repeat":    toggleRepeatMode(); break;
      default: break;
    }
  };

  const ask = (q: string) => {
    if (!q.trim() || sending) return;
    const ctx = {
      nowPlaying: currentSong
        ? { title: currentSong.title, artist: currentSong.artist, id: (currentSong as any)._id }
        : undefined,
      recent: (recent || []).slice(0, 10).map((s: any) => ({
        title: s.title, artist: s.artist, id: (s as any)._id
      })),
    };
    send({ message: q, context: ctx, applyClientInstruction });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby="ai-chat-desc"
        className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          z-[90]
          w-[96vw] sm:w-[900px] lg:w-[1100px] max-w-[98vw]
          h-[85vh] max-h-[90vh]
          p-0 overflow-hidden rounded-2xl border-0
          bg-zinc-950/90 backdrop-blur-2xl
          ring-1 ring-zinc-700/60
          shadow-[0_40px_160px_rgba(0,0,0,0.65),0_16px_64px_rgba(16,185,129,0.25)]
        "
      >
        {/* Background gradient wash */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_0%,rgba(16,185,129,0.12),rgba(0,0,0,0)_70%),radial-gradient(50%_50%_at_90%_10%,rgba(99,102,241,0.12),rgba(0,0,0,0)_70%)]" />
        </div>

        {/* Header */}
        <DialogHeader className="relative z-10 px-6 pt-5 pb-4 border-b border-zinc-800/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/60 ring-1 ring-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.25)]">
                <Sparkles className="h-[18px] w-[18px] text-emerald-400" />
              </span>
              AI Music Companion
            </DialogTitle>
          </div>
          <DialogDescription id="ai-chat-desc" className="sr-only">
            Chat with your music assistant to play songs, queue tracks, control playback and get recommendations.
          </DialogDescription>
        </DialogHeader>

        {/* Quick suggestions */}
        <div className="relative z-10 flex flex-wrap gap-3 px-6 py-3 border-b border-zinc-800/60">
          <SuggestionChip label="Play Phir Na Aisi Raat" onClick={() => ask("play Phir Na Aisi Raat")} />
          <SuggestionChip label="Show lyrics" onClick={() => ask("show lyrics")} />
          <SuggestionChip label="Who is the artist?" onClick={() => ask("who is the artist?")} />
          <SuggestionChip label="Volume 30" onClick={() => ask("set volume 30")} />
          <SuggestionChip label="Repeat one" onClick={() => ask("repeat one")} />
        </div>

        {/* Chat Body */}
        <div className="relative z-10 flex flex-col h-[calc(85vh-160px)]">
          <ScrollArea className="flex-1 px-6 py-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-sm text-zinc-400">
                Try “Play Bohemian Rhapsody”, “Show lyrics”, “Who sang this?”, or “Make a chill electronic playlist”.
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 text-[15px] whitespace-pre-wrap leading-relaxed ${
                        isUser
                          ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
                          : "bg-zinc-900/70 ring-1 ring-white/10 text-zinc-100"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sending && (
              <div className="mt-2 flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/70 ring-1 ring-white/10 px-4 py-3 text-sm text-zinc-100">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </ScrollArea>

          {/* Input Bar */}
          <form
            className="flex gap-2 p-4 border-t border-zinc-800/60 bg-zinc-950/40"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              placeholder="Try: play tere hawaale • pause • next • volume 30 • repeat one • show lyrics"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-zinc-950/60 border-zinc-800/60 focus-visible:ring-emerald-500/40 h-12 text-[15px]"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="gap-2 h-12 px-5">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {sending ? "Thinking" : "Send"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
