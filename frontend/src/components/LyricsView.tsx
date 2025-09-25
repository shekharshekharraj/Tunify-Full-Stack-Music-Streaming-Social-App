import { usePlayerStore } from "@/stores/usePlayerStore";
import { X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LyricLine = { time: number; text: string };

const parseLRC = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];
  const lines = lrcText.split("\n");
  const parsed: LyricLine[] = [];
  for (const line of lines) {
    const m = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (!m) continue;
    const mm = parseInt(m[1], 10);
    const ss = parseInt(m[2], 10);
    const ms = parseInt(m[3].padEnd(3, "0"), 10);
    const text = m[4].trim();
    if (text) parsed.push({ time: mm * 60 + ss + ms / 1000, text });
  }
  return parsed.sort((a, b) => a.time - b.time);
};

const LyricsView = () => {
  const { currentSong, showLyrics, toggleLyrics, currentTime } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const lyrics = useMemo(() => (currentSong?.lyrics ? parseLRC(currentSong.lyrics) : []), [currentSong]);

  useEffect(() => {
    if (!lyrics.length) {
      setCurrentLineIndex(-1);
      return;
    }
    let idx =
      lyrics.findIndex((line, i) => {
        const next = lyrics[i + 1];
        return currentTime >= line.time && (!next || currentTime < next.time);
      });
    if (idx === -1 && currentTime > 0) idx = lyrics.length - 1;
    setCurrentLineIndex(idx);
  }, [currentTime, lyrics]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentLineIndex]);

  if (!showLyrics || !currentSong) return null;

  return (
    <div
      className="
        fixed top-0 right-0 bottom-24 w-full sm:w-96
        bg-zinc-900/95 backdrop-blur-md
        z-[60]                 /* ↑ above Topbar (which is z-50) */
        p-0 flex flex-col
        animate-in slide-in-from-right
      "
    >
      {/* Sticky header so the title is always visible and not blended away */}
      <div className="sticky top-0 z-10 -mx-0 px-6 pt-5 pb-3 bg-zinc-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Lyrics</h2>
          <button onClick={toggleLyrics} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Track identity */}
        <div className="flex items-center gap-4 mt-4">
          <img src={currentSong.imageUrl} alt={currentSong.title} className="w-16 h-16 rounded-md" />
          <div>
            <p className="font-semibold">{currentSong.title}</p>
            <p className="text-sm text-zinc-400">{currentSong.artist}</p>
          </div>
        </div>
      </div>

      {/* Scrollable lyrics area */}
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="flex flex-col gap-4">
          {lyrics.length ? (
            lyrics.map((line, i) => (
              <p
                key={i}
                ref={i === currentLineIndex ? activeLineRef : null}
                className={cn(
                  "text-2xl font-semibold transition-colors duration-300",
                  i === currentLineIndex ? "text-white" : "text-zinc-500"
                )}
              >
                {line.text}
              </p>
            ))
          ) : (
            <p className="text-zinc-500 text-center mt-8">No lyrics available for this song.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LyricsView;
