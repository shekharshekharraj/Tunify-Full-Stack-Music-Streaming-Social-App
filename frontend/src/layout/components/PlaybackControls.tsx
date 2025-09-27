import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore, resumeAudioContext } from "@/stores/usePlayerStore";
import {
  Laptop2,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Maximize2,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * PlaybackControls — premium, responsive player bar
 * - Glass, gradient, and subtle shadows for depth
 * - Larger, tactile transport controls with smooth hover/active states
 * - Keyboard shortcuts (Space, ←/→ seek, ↑/↓ volume)
 * - Mobile-friendly: compact slider; desktop: full timeline + volume
 * - A11y labels everywhere; safe fallbacks if audio element missing
 */
export const PlaybackControls: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    toggleFullScreen,
    showLyrics,
    toggleLyrics,
    currentTime: storeCurrentTime,
    setCurrentTime,
    repeatMode,
    toggleRepeatMode,
    audioNodes,
  } = usePlayerStore();

  const [volume, setVolume] = useState(75);
  const [currentTimeLocal, setCurrentTimeLocal] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // prefer audio from store if present
  const audioElement = audioNodes?.audioElement ?? null;

  useEffect(() => {
    audioRef.current =
      audioElement ?? (document.getElementById("global-audio") as HTMLAudioElement | null) ?? null;
  }, [audioElement]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.crossOrigin = "anonymous";
      audio.setAttribute("crossorigin", "anonymous");
    } catch {}

    const updateTime = () => {
      setCurrentTimeLocal(audio.currentTime);
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    // initial sync
    setCurrentTimeLocal(audio.currentTime || 0);
    setCurrentTime(audio.currentTime || 0);
    setDuration(isFinite(audio.duration) ? audio.duration : 0);

    // initial volume
    audio.volume = volume / 100;

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef.current, currentSong, setCurrentTime]);

  useEffect(() => {
    setCurrentTimeLocal(storeCurrentTime);
  }, [storeCurrentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume / 100;
  }, [volume]);

  const ensureAudioReady = async () => {
    await resumeAudioContext(audioNodes?.audioContext);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = value[0];
    audio.currentTime = t;
    setCurrentTime(t);
    setCurrentTimeLocal(t);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) audio.volume = newVolume / 100;
  };

  // ---- NEW: don't hijack keys while typing in inputs/textareas/contentEditable
  const isTypingInEditable = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    // also bail if focus is not on the body
    if (document.activeElement && document.activeElement !== document.body) return true;
    return false;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      // <-- guard: let typing work anywhere in the app
      if (isTypingInEditable(e)) return;

      if (!currentSong) return;
      switch (e.key) {
        case " ": // Space: play/pause
          e.preventDefault();
          await ensureAudioReady();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (audioRef.current) {
            const t = Math.min((audioRef.current.currentTime || 0) + 5, duration || Infinity);
            audioRef.current.currentTime = t;
            setCurrentTime(t);
            setCurrentTimeLocal(t);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (audioRef.current) {
            const t = Math.max((audioRef.current.currentTime || 0) - 5, 0);
            audioRef.current.currentTime = t;
            setCurrentTime(t);
            setCurrentTimeLocal(t);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange([Math.min(volume + 5, 100)]);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange([Math.max(volume - 5, 0)]);
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSong, duration, togglePlay, volume]);

  const repeatActive = repeatMode !== "off";

  // Subtle gradient for timeline track
  const timelineMax = useMemo(() => (duration && Number.isFinite(duration) ? duration : 100), [duration]);

  return (
    <footer
      className="h-20 sm:h-24 bg-gradient-to-t from-zinc-950/90 to-zinc-900/60 border-t border-white/5 backdrop-blur-xl px-3 sm:px-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)]"
      aria-label="Playback controls"
    >
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        {/* Left: song info + fullscreen */}
        <div className="hidden sm:flex items-center gap-4 min-w-[220px] w-[32%]">
          {currentSong ? (
            <>
              <img
                src={currentSong.imageUrl}
                alt={currentSong.title}
                className="w-14 h-14 object-cover rounded-xl ring-1 ring-white/10 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate hover:underline cursor-pointer text-white"
                  title={currentSong.title}
                >
                  {currentSong.title}
                </div>
                <div
                  className="text-sm text-zinc-400 truncate hover:underline cursor-pointer"
                  title={currentSong.artist}
                >
                  {currentSong.artist}
                </div>
              </div>
              <Button
                aria-label="Enter full screen player"
                size="icon"
                variant="ghost"
                className="hover:text-white text-zinc-400 hover:bg-white/5"
                onClick={async () => {
                  await ensureAudioReady();
                  toggleFullScreen();
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-sm text-zinc-400">Not playing</div>
          )}
        </div>

        {/* Center: transport controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[44%]">
          <div className="flex items-center gap-3 sm:gap-5">
            <Button
              aria-label="Shuffle"
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex hover:text-white text-zinc-400 hover:bg-white/5"
              disabled={!currentSong}
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              aria-label="Previous"
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-300 hover:bg-white/5"
              onClick={async () => {
                await ensureAudioReady();
                playPrevious();
              }}
              disabled={!currentSong}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              aria-label={isPlaying ? "Pause" : "Play"}
              size="icon"
              className="bg-white text-black rounded-full h-10 w-10 shadow-lg hover:bg-white/90 active:scale-[0.98] transition-transform"
              onClick={async () => {
                await ensureAudioReady();
                togglePlay();
              }}
              disabled={!currentSong}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            <Button
              aria-label="Next"
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-300 hover:bg-white/5"
              onClick={async () => {
                await ensureAudioReady();
                playNext();
              }}
              disabled={!currentSong}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <Button
              aria-label={repeatMode === "one" ? "Repeat one" : repeatActive ? "Repeat all" : "Repeat off"}
              size="icon"
              variant="ghost"
              onClick={async () => {
                await ensureAudioReady();
                toggleRepeatMode();
              }}
              className={`hidden sm:inline-flex hover:text-white hover:bg-white/5 ${
                repeatActive ? "text-emerald-400" : "text-zinc-400"
              }`}
              disabled={!currentSong}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>
          </div>

          {/* Timeline */}
          <div className="hidden sm:flex items-center gap-2 w-full">
            <div className="text-[11px] tabular-nums text-zinc-400 min-w-[32px] text-right">
              {formatTime(currentTimeLocal)}
            </div>
            <div className="relative flex-1">
              <Slider
                value={[currentTimeLocal]}
                max={timelineMax}
                step={1}
                className="w-full group [--track:linear-gradient(90deg,rgba(255,255,255,0.45),rgba(255,255,255,0.2))]"
                onValueChange={async (value) => {
                  await ensureAudioReady();
                  handleSeek(value);
                }}
              />
              {/* Glow underline on hover */}
              <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] tabular-nums text-zinc-400 min-w-[32px]">
              {formatTime(duration)}
            </div>
          </div>

          {/* Compact mobile timeline */}
          <div className="sm:hidden w-full">
            <Slider
              aria-label="Seek"
              value={[currentTimeLocal]}
              max={timelineMax}
              step={1}
              className="w-full"
              onValueChange={async (value) => {
                await ensureAudioReady();
                handleSeek(value);
              }}
            />
          </div>
        </div>

        {/* Right: extras + volume */}
        <div className="hidden sm:flex items-center gap-3 min-w-[240px] w-[32%] justify-end">
          <Button
            aria-label={showLyrics ? "Hide lyrics" : "Show lyrics"}
            size="icon"
            variant="ghost"
            onClick={async () => {
              await ensureAudioReady();
              toggleLyrics();
            }}
            className={`hover:text-white hover:bg-white/5 ${showLyrics ? "text-emerald-400" : "text-zinc-400"}`}
            disabled={!currentSong}
          >
            <Mic2 className="h-4 w-4" />
          </Button>

          <Button aria-label="Queue" size="icon" variant="ghost" className="hover:text-white text-zinc-400 hover:bg-white/5">
            <ListMusic className="h-4 w-4" />
          </Button>

          <Button aria-label="Connect device" size="icon" variant="ghost" className="hover:text-white text-zinc-400 hover:bg-white/5">
            <Laptop2 className="h-4 w-4" />
          </Button>

          {/* Volume: expands on hover */}
          <div className="flex items-center gap-2 group">
            <Button aria-label="Volume" size="icon" variant="ghost" className="hover:text-white text-zinc-400 hover:bg-white/5">
              <Volume1 className="h-4 w-4" />
            </Button>
            <div className="w-20 transition-[width] duration-200 ease-out group-hover:w-28">
              <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
