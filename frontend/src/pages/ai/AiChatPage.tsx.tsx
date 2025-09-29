import { useEffect, useMemo, useRef } from "react";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Music2, Mic2, Info, Volume2, SkipForward, Pause, Play } from "lucide-react";
import SuggestionChip from "@/components/ai/SuggestionChip";

export default function AiChatPage() {
  const { messages, input, setInput, sending, send } = useAiChatStore();
  const { currentSong, isPlaying, playNext, audioNodes } = usePlayerStore() as any;
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const nowPlayingMeta = useMemo(() => {
    if (!currentSong) return null;
    return {
      title: currentSong.title,
      artist: currentSong.artist || "",
      image: currentSong.imageUrl || "",
    };
  }, [currentSong]);

  const ask = (q: string) => {
    if (!q.trim() || sending) return;
    send({ message: q });
  };

  return (
    <div className="relative min-h-[calc(100vh-96px)] overflow-hidden">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_10%,rgba(16,185,129,0.12),rgba(0,0,0,0)_60%),radial-gradient(40%_50%_at_80%_10%,rgba(99,102,241,0.12),rgba(0,0,0,0)_60%)]" />
        <div className="absolute -inset-32 blur-3xl opacity-20 bg-gradient-to-br from-emerald-400/30 via-fuchsia-400/20 to-indigo-400/30" />
      </div>

      {/* PAGE CONTENT */}
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/60 ring-1 ring-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.25)]">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">AI Music Companion</h1>
              <p className="text-xs md:text-sm text-zinc-400">Ask in natural language. I’ll play, queue, recommend or explain.</p>
            </div>
          </div>

          {/* NOW PLAYING MINI */}
          {nowPlayingMeta && (
            <div className="hidden md:flex items-center gap-4 rounded-xl bg-zinc-900/60 p-2 pr-3 ring-1 ring-zinc-700/60 backdrop-blur-md">
              <img
                src={nowPlayingMeta.image}
                alt={nowPlayingMeta.title}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{nowPlayingMeta.title}</div>
                <div className="truncate text-xs text-zinc-400">{nowPlayingMeta.artist}</div>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-zinc-300 hover:text-white"
                  onClick={() => {
                    const a: HTMLAudioElement | null = audioNodes?.audioElement ?? document.getElementById("global-audio") as any;
                    if (!a) return;
                    if (isPlaying) a.pause(); else a.play().catch(() => {});
                  }}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-zinc-300 hover:text-white"
                  onClick={() => playNext()}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* LAYOUT: CHAT + RIGHT RAIL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CHAT PANEL */}
          <div className="lg:col-span-2 rounded-2xl ring-1 ring-zinc-700/60 bg-zinc-900/70 backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 p-3 border-b border-zinc-800/60">
              <SuggestionChip icon={<Music2 className="h-3.5 w-3.5" />} label="Play Phir Na Aisi Raat" onClick={() => ask("play Phir Na Aisi Raat")} />
              <SuggestionChip icon={<Mic2 className="h-3.5 w-3.5" />} label="Show lyrics" onClick={() => ask("show lyrics")} />
              <SuggestionChip icon={<Info className="h-3.5 w-3.5" />} label="Tell me about the artist" onClick={() => ask("who is the artist?")} />
              <SuggestionChip icon={<Volume2 className="h-3.5 w-3.5" />} label="Volume 30" onClick={() => ask("set volume 30")} />
            </div>

            {/* Messages */}
            <ScrollArea className="h-[58vh] md:h-[60vh] p-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="max-w-sm text-zinc-400 text-sm">
                    Tip: Ask things like <span className="text-zinc-100">“Play Bohemian Rhapsody”</span>,{" "}
                    <span className="text-zinc-100">“Show lyrics”</span>,{" "}
                    <span className="text-zinc-100">“Who sang this?”</span>, or{" "}
                    <span className="text-zinc-100">“Make a chill electronic playlist”</span>.
                  </div>
                </div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={i} className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[85%] whitespace-pre-wrap leading-relaxed",
                        "rounded-2xl px-3.5 py-2.5 text-sm",
                        isUser
                          ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
                          : "bg-zinc-800/80 text-zinc-100 ring-1 ring-white/10",
                      ].join(" ")}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </ScrollArea>

            {/* Input */}
            <form
              className="flex gap-2 p-3 border-t border-zinc-800/60"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <Input
                placeholder="Ask to play, queue, get info, toggle lyrics…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-zinc-950/60 border-zinc-800/60 focus-visible:ring-emerald-500/40"
              />
              <Button type="submit" disabled={sending || !input.trim()} className="gap-2">
                {sending ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                {sending ? "Thinking" : "Send"}
              </Button>
            </form>
          </div>

          {/* RIGHT RAIL: Context / Now Playing */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="rounded-2xl ring-1 ring-zinc-700/60 bg-zinc-900/70 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h3 className="text-sm font-medium mb-3">Now Playing</h3>
              {nowPlayingMeta ? (
                <div className="flex items-center gap-3">
                  <img src={nowPlayingMeta.image} alt={nowPlayingMeta.title} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{nowPlayingMeta.title}</div>
                    <div className="truncate text-xs text-zinc-400">{nowPlayingMeta.artist}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-400">No song is currently playing.</div>
              )}
            </div>

            <div className="rounded-2xl ring-1 ring-zinc-700/60 bg-zinc-900/70 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h3 className="text-sm font-medium mb-3">Try these</h3>
              <div className="flex flex-wrap gap-2">
                <SuggestionChip label="Play next" onClick={() => ask("next")} />
                <SuggestionChip label="Play previous" onClick={() => ask("previous")} />
                <SuggestionChip label="Queue Kesariya" onClick={() => ask("queue kesariya")} />
                <SuggestionChip label="Repeat one" onClick={() => ask("repeat one")} />
                <SuggestionChip label="Who is the artist?" onClick={() => ask("who is the artist?")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
