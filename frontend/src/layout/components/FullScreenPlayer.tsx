import { usePlayerStore } from "@/stores/usePlayerStore";
import { ChevronDown, Pause, Play, SkipBack, SkipForward, Waves, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState, useCallback } from "react";
import ColorThief from "colorthief";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const clampRGB = (rgb: string) => {
  const [r, g, b] = (rgb || "20,20,20").split(",").map((n) => Math.max(0, Math.min(255, Number(n) || 0)));
  return `${r},${g},${b}`;
};

const FullScreenPlayer = () => {
  const {
    currentSong,
    isFullScreen,
    toggleFullScreen,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    setDominantColor,
    dominantColor,
    audioNodes,
  } = usePlayerStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVisualizer, setShowVisualizer] = useState(true);

  const playerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Time/Duration sync with global audio element
  useEffect(() => {
    const audio = audioNodes.audioElement;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    setCurrentTime(audio.currentTime || 0);
    setDuration(isFinite(audio.duration) ? audio.duration : 0);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [audioNodes.audioElement]);

  // Fullscreen API sync
  const requestFullScreenOnUserGesture = useCallback(() => {
    if (playerRef.current?.requestFullscreen) playerRef.current.requestFullscreen();
  }, []);
  const exitFullScreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
  }, []);
  useEffect(() => {
    const onChange = () => {
      const isNative = !!document.fullscreenElement;
      if (isNative !== isFullScreen) toggleFullScreen();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [isFullScreen, toggleFullScreen]);
  useEffect(() => {
    if (!isFullScreen && document.fullscreenElement) exitFullScreen();
  }, [isFullScreen, exitFullScreen]);

  // Dominant color extraction
  useEffect(() => {
    if (currentSong?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = currentSong.imageUrl;
      img.onload = () => {
        try {
          const thief = new ColorThief();
          const rgb = thief.getColor(img);
          setDominantColor(`${rgb[0]},${rgb[1]},${rgb[2]}`);
        } catch {
          setDominantColor("20,20,20");
        }
      };
      img.onerror = () => setDominantColor("20,20,20");
    } else {
      setDominantColor("20,20,20");
    }
  }, [currentSong?.imageUrl, setDominantColor]);

  // Visualizer (pauses when showVisualizer = false)
  useEffect(() => {
    const { analyser, audioContext } = audioNodes;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const stop = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (!showVisualizer || !analyser || !ctx || !canvas || !isFullScreen || !audioContext || audioContext.state === "closed") {
      stop();
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const [r, g, b] = clampRGB(dominantColor).split(",").map(Number);

    const draw = () => {
      if (!showVisualizer || !audioNodes.analyser || !canvasRef.current || !audioNodes.audioContext || audioNodes.audioContext.state === "closed") {
        stop();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
      audioNodes.analyser.getByteFrequencyData(dataArray);

      const c = canvasRef.current;
      const gctx = c.getContext("2d")!;
      const W = c.width;
      const H = c.height;

      // Trail
      gctx.fillStyle = "rgba(0,0,0,0.12)";
      gctx.fillRect(0, 0, W, H);

      const barCount = Math.min(96, bufferLength);
      const gap = 2;
      const barW = Math.max(1, (W - gap * (barCount - 1)) / barCount);

      const grad = gctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(0.5, `rgba(${r + 30},${g + 30},${b + 30},0.9)`);
      grad.addColorStop(1, "rgba(255,255,255,0.85)");

      gctx.fillStyle = grad;
      gctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
      gctx.shadowBlur = 16;

      let x = 0;
      for (let i = 0; i < barCount; i++) {
        const v = dataArray[i] / 255;
        const h = Math.pow(v, 0.95) * H * 0.9;
        gctx.fillRect(x, H - h, barW, h);
        x += barW + gap;
      }
    };

    draw();
    return stop;
  }, [showVisualizer, isFullScreen, isPlaying, dominantColor, audioNodes]);

  // Seek
  const handleSeek = (value: number[]) => {
    const audio = audioNodes.audioElement;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFullScreen) return;
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        const a = audioNodes.audioElement;
        if (a) a.currentTime = Math.min((a.currentTime || 0) + 5, a.duration || a.currentTime);
      } else if (e.code === "ArrowLeft") {
        const a = audioNodes.audioElement;
        if (a) a.currentTime = Math.max((a.currentTime || 0) - 5, 0);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [isFullScreen, togglePlay, audioNodes.audioElement]);

  if (!isFullScreen || !currentSong) return null;

  const rgb = clampRGB(dominantColor);

  return (
    <div ref={playerRef} className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden">
      {/* Deep backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-[.35] blur-2xl"
        style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(1200px 600px at 25% -10%, rgba(${rgb},0.35), rgba(0,0,0,0) 70%),
            radial-gradient(900px 420px at 85% 0%, rgba(${rgb},0.18), rgba(0,0,0,0) 70%),
            linear-gradient(to bottom, rgba(${rgb},0.16), rgba(0,0,0,0.88) 65%)
          `,
        }}
      />

      {/* Top-right controls */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <Button
          variant={showVisualizer ? "default" : "outline"}
          size="sm"
          className={showVisualizer ? "bg-white text-black hover:bg-white/90" : "text-white border-white/20 hover:bg-white/10"}
          onClick={() => setShowVisualizer((s) => !s)}
          title={showVisualizer ? "Hide visualizer" : "Show visualizer"}
          aria-label="Toggle visualizer"
        >
          {showVisualizer ? <Waves className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
          {showVisualizer ? "Visualizer" : "Hidden"}
        </Button>

        <button
          onClick={() => {
            toggleFullScreen();
            requestFullScreenOnUserGesture();
          }}
          className="text-white/75 hover:text-white transition-colors"
          aria-label="Close full screen"
          title="Close"
        >
          <ChevronDown size={34} />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[980px] px-4">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 items-center">
          {/* Cover + pulse */}
          <div className="relative mx-auto">
            <div
              className={`absolute inset-0 rounded-3xl -z-10 transition-opacity ${isPlaying ? "opacity-100" : "opacity-60"}`}
              style={{
                boxShadow: `0 0 80px 18px rgba(${rgb},0.20), 0 0 140px 32px rgba(${rgb},0.12)`,
                animation: isPlaying ? "tunify-pulse 2.6s ease-in-out infinite" : "none",
              }}
            />
            <img
              src={currentSong.imageUrl}
              alt={currentSong.title}
              className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] object-cover rounded-3xl shadow-[0_12px_60px_rgba(0,0,0,.55)] ring-1 ring-white/10"
            />
          </div>

          {/* Glass controls */}
          <div className="relative rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
            <div className="mb-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {currentSong.title}
              </h2>
              <p className="mt-1 text-zinc-300 text-lg">{currentSong.artist}</p>
            </div>

            <div className="w-full space-y-2">
              <Slider value={[currentTime]} max={duration || 100} step={1} className="w-full cursor-pointer" onValueChange={handleSeek} />
              <div className="flex justify-between text-xs text-zinc-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <Button
                size="icon"
                variant="ghost"
                className="text-zinc-300 hover:text-white hover:bg-white/10"
                onClick={playPrevious}
                aria-label="Previous"
                title="Previous"
              >
                <SkipBack className="h-7 w-7" />
              </Button>

              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_12px_30px_rgba(0,0,0,.35)]"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
                style={{ boxShadow: `0 0 0 6px rgba(${rgb},0.18), 0 0 60px rgba(${rgb},0.26)` }}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="text-zinc-300 hover:text-white hover:bg-white/10"
                onClick={playNext}
                aria-label="Next"
                title="Next"
              >
                <SkipForward className="h-7 w-7" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Equalizer (conditionally rendered) */}
      {showVisualizer && (
        <div className="absolute bottom-0 left-0 right-0 h-44 flex items-end justify-center pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full max-w-6xl" width={1200} height={176} />
        </div>
      )}

      <style>{`
        @keyframes tunify-pulse {
          0%   { transform: scale(0.98); opacity: .85; }
          50%  { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(0.98); opacity: .85; }
        }
      `}</style>
    </div>
  );
};

export default FullScreenPlayer;
