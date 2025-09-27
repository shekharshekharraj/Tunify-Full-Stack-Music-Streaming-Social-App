import { usePlayerStore } from "@/stores/usePlayerStore";
import { X, Crosshair, Minus, Plus, Maximize2, Minimize2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LyricLine = { time: number; text: string };

const parseLRC = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];
  const text = lrcText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  let globalOffsetMs = 0;
  for (const ln of lines) {
    const off = ln.match(/^\s*\[offset:([+-]?\d+)\]\s*$/i);
    if (off) { globalOffsetMs = parseInt(off[1], 10) || 0; break; }
  }

  const tsRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const parsed: LyricLine[] = [];

  for (const raw of lines) {
    if (/^\s*\[(ti|ar|al|by|id):.*\]\s*$/i.test(raw)) continue;

    let match: RegExpExecArray | null;
    const times: number[] = [];
    let lastIndex = 0;

    while ((match = tsRe.exec(raw))) {
      const mm = parseInt(match[1]!, 10) || 0;
      const ss = parseInt(match[2]!, 10) || 0;
      const frac = match[3] ?? "";
      const ms = parseInt(frac.padEnd(3, "0"), 10) || 0;
      const t = mm * 60 + ss + ms / 1000;
      times.push(t);
      lastIndex = match.index + match[0].length;
    }
    if (!times.length) continue;

    const textAfter = raw.slice(lastIndex).trim();
    if (!textAfter) continue;

    for (const t of times) {
      const timeWithOffset = t + globalOffsetMs / 1000;
      if (timeWithOffset >= 0) parsed.push({ time: timeWithOffset, text: textAfter });
    }
  }

  parsed.sort((a, b) => a.time - b.time);
  const dedup: LyricLine[] = [];
  let lastTime = -1;
  for (const p of parsed) {
    if (Math.abs(p.time - lastTime) > 1e-6) { dedup.push(p); lastTime = p.time; }
  }
  return dedup;
};

const findCurrentIndex = (lyrics: LyricLine[], t: number) => {
  if (!lyrics.length) return -1;
  let lo = 0, hi = lyrics.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyrics[mid].time <= t) { ans = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  return ans;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const LyricsView = () => {
  const { currentSong, showLyrics, toggleLyrics, currentTime } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const [autoCenter, setAutoCenter] = useState(true);
  const [fontScale, setFontScale] = useState(1); // 0.9 - 1.3
  const [isFs, setIsFs] = useState(false);       // fullscreen toggle

  const decFont = () => setFontScale((s) => clamp(s - 0.05, 0.9, 1.3));
  const incFont = () => setFontScale((s) => clamp(s + 0.05, 0.9, 1.3));

  const lyrics = useMemo(
    () => (currentSong?.lyrics ? parseLRC(currentSong.lyrics) : []),
    [currentSong]
  );

  useEffect(() => {
    if (!lyrics.length) { setCurrentLineIndex(-1); return; }
    setCurrentLineIndex(findCurrentIndex(lyrics, currentTime));
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (!autoCenter) return;
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentLineIndex, autoCenter]);

  if (!showLyrics || !currentSong) return null;

  // Bigger base font when fullscreen
  const baseRem = isFs ? 2.2 : 1.25; // desktop-friendly sizes
  const baseFontSize = `${fontScale * baseRem}rem`;
  const activeScale = isFs ? 1.08 : 1.02;

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 6%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 94%, rgba(0,0,0,0) 100%)",
    maskImage:
      "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 6%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 94%, rgba(0,0,0,0) 100%)",
  };

  const containerClass = cn(
    "fixed z-[80] p-0 flex flex-col overflow-hidden",
    isFs ? "inset-0 w-full" : "top-0 right-0 bottom-24 w-full sm:w-96 animate-in slide-in-from-right"
  );

  const containerStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient( to bottom, rgba(10,10,12,0.85), rgba(10,10,12,0.92) ),
      url(${currentSong.imageUrl})
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backdropFilter: "blur(10px)",
  };

  return (
    <div className={containerClass} style={containerStyle}>
      {/* Top glossy bar */}
      <div className="sticky top-0 z-10 px-5 pt-4 pb-3 bg-black/35 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide text-zinc-100">
            {isFs ? "Lyrics — Fullscreen" : "Lyrics"}
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300" onClick={decFont} title="Decrease text size">
              <Minus className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300" onClick={incFont} title="Increase text size">
              <Plus className="h-4 w-4" />
            </button>
            <button
              className={cn("p-1.5 rounded-lg", autoCenter ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-300", "hover:bg-white/10")}
              onClick={() => setAutoCenter(v => !v)}
              title={autoCenter ? "Auto-center: on" : "Auto-center: off"}
            >
              <Crosshair className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
              onClick={() => setIsFs(v => !v)}
              title={isFs ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={toggleLyrics} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300" title="Close lyrics">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Track identity */}
        <div className="flex items-center gap-3 mt-3">
          <img src={currentSong.imageUrl} alt={currentSong.title} className="w-12 h-12 rounded-md ring-1 ring-white/10 object-cover" />
          <div className="min-w-0">
            <p className="font-semibold text-zinc-100 truncate">{currentSong.title}</p>
            <p className="text-sm text-zinc-400 truncate">{currentSong.artist}</p>
          </div>
        </div>
      </div>

      {/* Scrollable lyrics area */}
      <ScrollArea className="flex-1 px-5 pb-6" style={maskStyle}>
        <div
          className={cn(
            "flex flex-col gap-4 py-6 px-2 overflow-visible",
            isFs && "items-center text-center" // center column & text in fullscreen
          )}
          style={{ fontSize: baseFontSize, lineHeight: 1.28 }}
        >
          {lyrics.length ? (
            lyrics.map((line, i) => {
              const active = i === currentLineIndex;
              return (
                <p
                  key={`${line.time}-${i}`}
                  ref={active ? activeLineRef : null}
                  className={cn(
                    "transition-all duration-300 will-change-transform px-1",
                    // in fullscreen, scale from center; in drawer, from left to avoid clipping
                    isFs ? "origin-center" : "origin-left",
                    active
                      ? "text-zinc-50"
                      : "text-zinc-400/80 hover:text-zinc-200/90"
                  )}
                  style={{
                    transform: active ? `scale(${activeScale})` : undefined,
                    textShadow: active ? "0 0 14px rgba(255,255,255,0.25)" : undefined,
                    // Optional max width for nicer reading in fullscreen:
                    maxWidth: isFs ? 1100 : undefined, // px
                  }}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <p className="text-zinc-400/80 text-center mt-8">No lyrics available for this song.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LyricsView;
