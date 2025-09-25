// src/components/PlaybackControls.tsx
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
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
import { useEffect, useRef, useState } from "react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
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

  return (
    <footer className="h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4">
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        {/* Left: song info + fullscreen */}
        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]">
          {currentSong ? (
            <>
              <img src={currentSong.imageUrl} alt={currentSong.title} className="w-14 h-14 object-cover rounded-md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate hover:underline cursor-pointer">{currentSong.title}</div>
                <div className="text-sm text-zinc-400 truncate hover:underline cursor-pointer">{currentSong.artist}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="hover:text-white text-zinc-400"
                onClick={() => {
                  toggleFullScreen();
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-sm text-zinc-500">Not playing</div>
          )}
        </div>

        {/* Center: transport controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]">
          <div className="flex items-center gap-4 sm:gap-6">
            <Button size="icon" variant="ghost" className="hidden sm:inline-flex hover:text-white text-zinc-400">
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button size="icon" variant="ghost" className="hover:text-white text-zinc-400" onClick={playPrevious} disabled={!currentSong}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button size="icon" className="bg-white hover:bg-white/80 text-black rounded-full h-8 w-8" onClick={togglePlay} disabled={!currentSong}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button size="icon" variant="ghost" className="hover:text-white text-zinc-400" onClick={playNext} disabled={!currentSong}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleRepeatMode}
              className={`hidden sm:inline-flex hover:text-white ${repeatMode !== "off" ? "text-green-500" : "text-zinc-400"}`}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>

            {/* ⬇️ REMOVED the center Mic2 button to avoid duplicate */}
          </div>

          <div className="hidden sm:flex items-center gap-2 w-full">
            <div className="text-xs text-zinc-400">{formatTime(currentTimeLocal)}</div>
            <Slider
              value={[currentTimeLocal]}
              max={duration || 100}
              step={1}
              className="w-full hover:cursor-grab active:cursor-grabbing"
              onValueChange={handleSeek}
            />
            <div className="text-xs text-zinc-400">{formatTime(duration)}</div>
          </div>
        </div>

        {/* Right: extras + volume */}
        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end">
          {/* Keep ONLY this lyrics toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleLyrics}
            className={`hover:text-white ${showLyrics ? "text-green-500" : "text-zinc-400"}`}
            disabled={!currentSong}
          >
            <Mic2 className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="ghost" className="hover:text-white text-zinc-400">
            <ListMusic className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="ghost" className="hover:text-white text-zinc-400">
            <Laptop2 className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="hover:text-white text-zinc-400">
              <Volume1 className="h-4 w-4" />
            </Button>

            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24 hover:cursor-grab active:cursor-grabbing"
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
