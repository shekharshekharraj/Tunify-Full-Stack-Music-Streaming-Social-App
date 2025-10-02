import { usePlayerStore } from "@/stores/usePlayerStore";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useCallback } from "react";
import ColorThief from "colorthief";

const clampRGB = (rgb: string) => {
  const [r, g, b] = (rgb || "20,20,20")
    .split(",")
    .map((n) => Math.max(0, Math.min(255, Number(n) || 0)));
  return `${r},${g},${b}`;
};

/* ---------- Color helpers (accent over dominant) ---------- */
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l }; // [0..1]
}

function pickAccentFromPalette(palette: number[][]) {
  // Prefer vibrant (high saturation) & mid-luma; ignore near-grays and extremes
  let best: number[] | null = null;
  let bestScore = -1;
  for (const c of palette) {
    const [r, g, b] = c;
    const { s, l } = rgbToHsl(r, g, b);
    if (s < 0.18) continue;              // drop grays
    if (l < 0.15 || l > 0.85) continue;  // drop too dark/bright
    // slight bonus for “cool” hues (blue/teal) so covers skew blue if close
    const coolBonus = (() => {
      const { h } = rgbToHsl(r, g, b);
      const deg = h * 360;
      return deg >= 190 && deg <= 245 ? 0.05 : 0;
    })();
    const score = s * (1 - Math.abs(l - 0.5)) + coolBonus;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best; // may be null
}

function averageCenterColor(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.max(120, Math.min(600, img.naturalWidth)));
  const h = (canvas.height = Math.max(120, Math.min(600, img.naturalHeight)));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  // center 60% crop
  const sx = Math.floor(w * 0.2), sy = Math.floor(h * 0.2);
  const sw = Math.floor(w * 0.6), sh = Math.floor(h * 0.6);
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number];
}
/* --------------------------------------------------------- */

const FullScreenPlayer = () => {
  const {
    currentSong,
    isFullScreen,
    toggleFullScreen,
    togglePlay,
    audioNodes,
    setDominantColor,
    dominantColor,
  } = usePlayerStore();

  const playerRef = useRef<HTMLDivElement>(null);

  // Fullscreen sync
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

  // Accent color extraction (palette-based with fallback)
  useEffect(() => {
    const url = currentSong?.imageUrl;
    if (!url) {
      setDominantColor("20,20,20");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      try {
        const thief = new ColorThief();
        const palette = (thief.getPalette(img, 8) as number[][]) || [];
        const accent = pickAccentFromPalette(palette);
        const chosen = accent ?? averageCenterColor(img);
        const [r, g, b] = chosen as [number, number, number];
        setDominantColor(`${r},${g},${b}`);
      } catch {
        const [r, g, b] = averageCenterColor(img);
        setDominantColor(`${r},${g},${b}`);
      }
    };

    img.onerror = () => setDominantColor("20,20,20");
  }, [currentSong?.imageUrl, setDominantColor]);

  // Keyboard shortcuts (Space, ←/→)
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
  const bgSolid = `rgb(${rgb})`;
  // slight darkening overlay for readability across bright covers
  const bgWithSoftDarken = `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), ${bgSolid}`;

  return (
    <div ref={playerRef} className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden">
      {/* Solid accent background */}
      <div className="absolute inset-0 -z-10" style={{ background: bgWithSoftDarken }} />

      {/* Top-right Close */}
      <div className="absolute top-5 right-5">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/90 hover:text-white"
          aria-label="Close full screen"
          title="Close"
          onClick={() => {
            toggleFullScreen();
            requestFullScreenOnUserGesture();
          }}
        >
          <ChevronDown size={34} />
        </Button>
      </div>

      {/* Centered: cover + details */}
      <div className="relative z-10 w-full max-w-[980px] px-4">
        <div className="mx-auto flex flex-col items-center text-center gap-8">
          <img
            src={currentSong.imageUrl}
            alt={currentSong.title}
            className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] object-cover rounded-3xl shadow-[0_12px_60px_rgba(0,0,0,.55)] ring-1 ring-white/10"
          />
          <div className="max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {currentSong.title}
            </h2>
            <p className="mt-2 text-zinc-100/90 text-xl">{currentSong.artist}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenPlayer;
