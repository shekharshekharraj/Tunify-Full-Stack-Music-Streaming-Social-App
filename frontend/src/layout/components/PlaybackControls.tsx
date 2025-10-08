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
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocation } from "react-router-dom";

/** Format seconds to m:ss */
const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

/**
 * A more responsive, industry-grade global playback bar:
 * - rAF ticker for time/duration sync
 * - Buffered progress layer (for audio)
 * - Throttled store writes (≈4hz)
 * - On-drag seek with commit
 * - rAF-batched volume changes
 */
export const PlaybackControls: React.FC = () => {
  const {
    // unified store values
    activeSource,
    currentYouTube,
    ytControl,
    seekTo,

    // library values (still needed)
    currentSong,

    // common controls
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

    // Dock
    showYouTubeDock,
    setShowYouTubeDock,
    toggleYouTubeDock,
  } = usePlayerStore();

  const { pathname } = useLocation();
  const onHome = pathname === "/";

  // pick the thing to display
  const display =
    activeSource === "youtube"
      ? currentYouTube
      : currentSong;

  // refs for DOM/audio/raf
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  // --- UI state (local, highly responsive) ---
  const [volume, setVolume] = useState(75);
  const [currentTimeLocal, setCurrentTimeLocal] = useState(0);
  const [durationLocal, setDurationLocal] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0); // for audio
  const [isSeeking, setIsSeeking] = useState(false);
  const pendingSeekRef = useRef<number | null>(null);

  // prefer audio element from store if present
  const audioElement = audioNodes?.audioElement ?? null;

  // Wire audio element reference
  useEffect(() => {
    audioElRef.current =
      audioElement ?? (document.getElementById("global-audio") as HTMLAudioElement | null) ?? null;
  }, [audioElement]);

  // Ensure audio has correct crossOrigin and volume once
  useLayoutEffect(() => {
    const audio = audioElRef.current;
    if (!audio) return;
    try {
      audio.crossOrigin = "anonymous";
      audio.setAttribute("crossorigin", "anonymous");
    } catch {}
    audio.volume = volume / 100;
  }, []);

  // rAF ticker for smooth progress + duration + buffered updates
  useEffect(() => {
    let lastStorePush = 0; // throttle store setCurrentTime to ~4hz
    const tick = () => {
      const now = performance.now();

      if (activeSource === "youtube" && ytControl) {
        // --- YouTube path ---
        const getCT = ytControl.getCurrentTime?.();
        const getDur = ytControl.getDuration?.();
        if (Number.isFinite(getCT as number)) {
          const ct = (getCT as number) || 0;
          if (!isSeeking) setCurrentTimeLocal(ct);
          if (now - lastStorePush > 250) {
            setCurrentTime(ct);
            lastStorePush = now;
          }
        }
        if (Number.isFinite(getDur as number) && (getDur as number) > 0) {
          setDurationLocal(getDur as number);
        }
        // no buffered layer for YT
        setBufferedEnd(0);
      } else {
        // --- Library (audio) path ---
        const audio = audioElRef.current;
        if (audio) {
          const ct = audio.currentTime || 0;
          if (!isSeeking) setCurrentTimeLocal(ct);
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDurationLocal(audio.duration);
          }
          // buffered layer
          try {
            const r = audio.buffered;
            if (r && r.length) {
              const end = r.end(r.length - 1);
              setBufferedEnd(end);
            }
          } catch {
            setBufferedEnd(0);
          }

          // Throttle store writes
          if (now - lastStorePush > 250) {
            setCurrentTime(ct);
            lastStorePush = now;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeSource, ytControl, isSeeking, setCurrentTime]);

  // Volume: rAF-batch any bursty changes to both audio + YT
  useEffect(() => {
    let f = 0;
    const apply = () => {
      const a = audioElRef.current;
      if (a) a.volume = volume / 100;
      ytControl?.setVolume?.(volume);
    };
    f = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(f);
  }, [volume, ytControl]);

  // Keep local time synced from store (in case other sources update it)
  useEffect(() => {
    if (!isSeeking) setCurrentTimeLocal(storeCurrentTime || 0);
  }, [storeCurrentTime, isSeeking]);

  const ensureAudioReady = useCallback(async () => {
    await resumeAudioContext(audioNodes?.audioContext);
  }, [audioNodes?.audioContext]);

  // SEEK handling (drag without spamming store; commit on release)
  const onSeekChange = useCallback((value: number[]) => {
    setIsSeeking(true);
    const t = value[0];
    setCurrentTimeLocal(t);
    pendingSeekRef.current = t;
  }, []);

  const onSeekCommit = useCallback(async (value: number[]) => {
    await ensureAudioReady();
    const t = value[0];
    pendingSeekRef.current = null;
    setIsSeeking(false);

    // unified seek
    if (seekTo) seekTo(t);

    // also set audio currentTime when library is active to avoid any drift
    const audio = audioElRef.current;
    if (activeSource !== "youtube" && audio) {
      audio.currentTime = t;
    }
    setCurrentTimeLocal(t);
  }, [ensureAudioReady, seekTo, activeSource]);

  // Volume change (instant UI, rAF applies to sinks)
  const onVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, []);

  // don't hijack keys while typing
  const isTypingInEditable = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (document.activeElement && document.activeElement !== document.body) return true;
    return false;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (isTypingInEditable(e)) return;

      if (!display) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          await ensureAudioReady();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeekCommit([Math.min((currentTimeLocal || 0) + 5, (durationLocal || Infinity))]);
          break;
        case "ArrowLeft":
          e.preventDefault();
          onSeekCommit([Math.max((currentTimeLocal || 0) - 5, 0)]);
          break;
        case "ArrowUp":
          e.preventDefault();
          onVolumeChange([Math.min(volume + 5, 100)]);
          break;
        case "ArrowDown":
          e.preventDefault();
          onVolumeChange([Math.max(volume - 5, 0)]);
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [display, durationLocal, togglePlay, volume, currentTimeLocal, onSeekCommit, onVolumeChange, ensureAudioReady]);

  const repeatActive = repeatMode !== "off";
  const timelineMax = useMemo(
    () => (durationLocal && Number.isFinite(durationLocal) ? durationLocal : 100),
    [durationLocal]
  );

  const toggleDock = () => {
    if (typeof setShowYouTubeDock === "function") {
      setShowYouTubeDock(!showYouTubeDock);
    } else if (typeof (toggleYouTubeDock as any) === "function") {
      (toggleYouTubeDock as any)();
    }
  };

  // derived display fields
  const displayTitle =
    activeSource === "youtube" ? currentYouTube?.title : currentSong?.title;
  const displayArtist =
    activeSource === "youtube" ? currentYouTube?.artist : currentSong?.artist;
  const displayImage =
    activeSource === "youtube" ? currentYouTube?.imageUrl : currentSong?.imageUrl;

  // buffered bar percent (audio only)
  const bufferedPct =
    activeSource === "youtube" || !timelineMax
      ? 0
      : Math.min(100, Math.max(0, (bufferedEnd / timelineMax) * 100));
  return (
    <footer
      className="h-20 sm:h-24 bg-gradient-to-t from-zinc-950/90 to-zinc-900/60 border-t border-white/5 backdrop-blur-xl px-3 sm:px-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)]"
      aria-label="Playback controls"
    >
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        {/* Left: now playing */}
        <div className="hidden sm:flex items-center gap-4 min-w-[220px] w-[32%]">
          {display ? (
            <>
              <img
                src={displayImage || "/placeholder.png"}
                alt={displayTitle || "Now playing"}
                className="w-14 h-14 object-cover rounded-xl ring-1 ring-white/10 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate hover:underline cursor-pointer text-white"
                  title={displayTitle}
                >
                  {displayTitle}
                </div>
                {displayArtist && (
                  <div
                    className="text-sm text-zinc-400 truncate hover:underline cursor-pointer"
                    title={displayArtist || undefined}
                  >
                    {displayArtist}
                  </div>
                )}
                {activeSource === "youtube" && !displayArtist && (
                  <div className="text-sm text-zinc-400 truncate">YouTube</div>
                )}
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

        {/* Center: transport */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[44%]">
          <div className="flex items-center gap-3 sm:gap-5">
            <Button
              aria-label="Shuffle"
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex hover:text-white text-zinc-400 hover:bg-white/5"
              disabled={!display || activeSource === "youtube"}
              title={activeSource === "youtube" ? "Shuffle only works for library" : "Shuffle"}
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
              disabled={!display || activeSource === "youtube"}
              title={activeSource === "youtube" ? "Previous works for library queue" : "Previous"}
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
              disabled={!display}
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
              disabled={!display || activeSource === "youtube"}
              title={activeSource === "youtube" ? "Next works for library queue" : "Next"}
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
              disabled={!display || activeSource === "youtube"}
              title={activeSource === "youtube" ? "Repeat works for library queue" : undefined}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>
          </div>

          {/* Timeline */}
          <div className="hidden sm:flex items-center gap-2 w-full">
            <div className="text-[11px] tabular-nums text-zinc-400 min-w-[32px] text-right">
              {formatTime(currentTimeLocal)}
            </div>

            <div className="relative flex-1 group">
              {/* Buffered layer (audio only) */}
              {activeSource !== "youtube" && (
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-full bg-white/10"
                  style={{ width: `${bufferedPct}%` }}
                />
              )}
              {/* Glow line under handle */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />

              <Slider
                value={[isSeeking && pendingSeekRef.current != null ? pendingSeekRef.current : currentTimeLocal]}
                max={timelineMax}
                step={1}
                className="
                  w-full
                  [--track:linear-gradient(90deg,rgba(255,255,255,0.55),rgba(255,255,255,0.25))]
                  data-[orientation=horizontal]:h-2
                  [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-full
                  [&_[role=slider]]:shadow-lg [&_[role=slider]]:border [&_[role=slider]]:border-white/20
                  [&_[role=slider]]:bg-white hover:[&_[role=slider]]:scale-110
                  focus:[&_[role=slider]]:outline-none focus:[&_[role=slider]]:ring-2 focus:[&_[role=slider]]:ring-emerald-400/60
                "
                onValueChange={onSeekChange}
                // @ts-ignore shadcn Slider supports onValueCommit
                onValueCommit={onSeekCommit}
                aria-label="Seek"
              />
            </div>

            <div className="text-[11px] tabular-nums text-zinc-400 min-w-[32px]">
              {formatTime(timelineMax)}
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="sm:hidden w-full">
            <Slider
              aria-label="Seek"
              value={[isSeeking && pendingSeekRef.current != null ? pendingSeekRef.current : currentTimeLocal]}
              max={timelineMax}
              step={1}
              className="w-full"
              onValueChange={onSeekChange}
              // @ts-ignore
              onValueCommit={onSeekCommit}
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
            disabled={!display || activeSource === "youtube"} // lyrics for library songs
            title={activeSource === "youtube" ? "Lyrics only for library tracks" : undefined}
          >
            <Mic2 className="h-4 w-4" />
          </Button>

          <Button aria-label="Queue" size="icon" variant="ghost" className="hover:text-white text-zinc-400 hover:bg-white/5">
            <ListMusic className="h-4 w-4" />
          </Button>

          {/* YouTube mini player toggle (Home only) */}
          <Button
            aria-label={showYouTubeDock ? "Hide YouTube panel" : "Show YouTube panel"}
            size="icon"
            variant="ghost"
            className={`hover:text-white hover:bg-white/5 ${showYouTubeDock ? "text-emerald-400" : "text-zinc-400"}`}
            onClick={toggleDock}
            disabled={!onHome}
            title={onHome ? "YouTube mini player" : "Open Home to use the YouTube panel"}
          >
            <Laptop2 className="h-4 w-4" />
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2 group">
            <Button
              aria-label="Volume"
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-400 hover:bg-white/5"
            >
              <Volume1 className="h-4 w-4" />
            </Button>
            <div className="w-20 transition-[width] duration-200 ease-out group-hover:w-28">
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
