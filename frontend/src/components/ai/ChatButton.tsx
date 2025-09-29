import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

export default function ChatButton() {
  const { setOpen } = useAiChatStore();
  const { isFullScreen } = usePlayerStore();

  if (isFullScreen) return null;

  // Keep it safely above the footer (works for both mobile/desktop),
  // and respect iOS safe-area if present.
  const bottomOffset = "calc(96px + 16px + env(safe-area-inset-bottom, 0px))";

  return (
    <div
      className="fixed right-4 md:right-6 z-[90]"
      style={{ bottom: bottomOffset }}
    >
      <Button
        aria-label="Open AI Music Companion"
        title="Ask the AI Music Companion"
        onClick={() => setOpen(true)}
        size="icon"
        className={[
          // size & shape
          "relative h-12 w-12 md:h-14 md:w-14 rounded-full",
          // glossy gradient “AI” vibe
          "bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-400",
          "text-white shadow-[0_8px_30px_rgb(2,6,23,0.45)] ring-1 ring-white/10",
          "transition-transform hover:scale-[1.04] active:scale-[0.98]",
        ].join(" ")}
      >
        {/* soft glow */}
        <span className="pointer-events-none absolute inset-0 rounded-full blur-xl opacity-30 bg-emerald-400" />

        {/* bot icon */}
         <Bot className="h-6 w-6 md:h-7 md:w-7 text-emerald-400 drop-shadow-[0_2px_6px_rgba(16,185,129,0.45)]" />


        {/* sparkle badge */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
          </span>
      </Button>
    </div>
  );
}
