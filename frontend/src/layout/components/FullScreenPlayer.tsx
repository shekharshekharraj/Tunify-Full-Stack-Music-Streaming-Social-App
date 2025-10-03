import { usePlayerStore } from "@/stores/usePlayerStore";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import FullscreenDock from "@/components/player/FullscreenDock";
import ColorThief from "colorthief";

/* ---------- Color helpers ---------- */
const clampRGB = (rgb: string) =>
  (rgb || "20,20,20")
    .split(",")
    .map((n) => Math.max(0, Math.min(255, Number(n) || 0)))
    .join(",");

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
  return { h, s, l };
}
function pickAccentFromPalette(palette: number[][]) {
  let best: number[] | null = null;
  let bestScore = -1;
  for (const c of palette) {
    const [r, g, b] = c;
    const { h, s, l } = rgbToHsl(r, g, b);
    if (s < 0.18) continue;
    if (l < 0.15 || l > 0.85) continue;
    const deg = h * 360;
    const coolBonus = deg >= 190 && deg <= 245 ? 0.05 : 0;
    const score = s * (1 - Math.abs(l - 0.5)) + coolBonus;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}
function averageCenterColor(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.max(120, Math.min(600, img.naturalWidth)));
  const h = (canvas.height = Math.max(120, Math.min(600, img.naturalHeight)));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const sx = Math.floor(w * 0.2), sy = Math.floor(h * 0.2);
  const sw = Math.floor(w * 0.6), sh = Math.floor(h * 0.6);
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number];
}
/* ----------------------------------- */

export default function FullScreenPlayer() {
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

  /* ====== Dock + Cursor logic ====== */
  const [dockVisible, setDockVisible] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);

  const hideTimerRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const insideDockRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastPointerY = useRef<number>(window.innerHeight);

  const SHOW_THRESHOLD = 160;
  const HIDE_THRESHOLD = 240;
  const SHOW_DELAY = 120;
  const HIDE_DELAY = 900;

  const clearTimers = () => {
    if (hideTimerRef.current) { window.clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    if (showTimerRef.current) { window.clearTimeout(showTimerRef.current); showTimerRef.current = null; }
  };

  const scheduleHide = () => {
    if (insideDockRef.current) return;
    if (hideTimerRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      if (!insideDockRef.current) {
        setDockVisible(false);
        setCursorHidden(true); // ⬅️ hide cursor when dock hides
      }
      hideTimerRef.current = null;
    }, HIDE_DELAY) as unknown as number;
  };

  const scheduleShow = () => {
    if (showTimerRef.current) return;
    showTimerRef.current = window.setTimeout(() => {
      clearTimers();
      setDockVisible(true);
      setCursorHidden(false); // ⬅️ ensure cursor visible with dock
    }, SHOW_DELAY) as unknown as number;
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isFullScreen) return;
    lastPointerY.current = e.clientY;

    // Any pointer move should show cursor immediately
    if (cursorHidden) setCursorHidden(false);

    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const y = lastPointerY.current;
      const winH = window.innerHeight;
      const distFromBottom = winH - y;

      if (distFromBottom <= SHOW_THRESHOLD) {
        scheduleShow();
      } else if (distFromBottom > HIDE_THRESHOLD) {
        scheduleHide();
      }
    });
  }, [isFullScreen, cursorHidden]);

  const onMouseSafe = (isInside: boolean) => {
    insideDockRef.current = isInside;
    if (isInside) {
      clearTimers();
      setDockVisible(true);
      setCursorHidden(false);
    } else {
      scheduleHide();
    }
  };

  useEffect(() => {
    if (!isFullScreen) {
      setDockVisible(false);
      setCursorHidden(false);
      clearTimers();
      return;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [isFullScreen, onPointerMove]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ====== Fullscreen API sync ====== */
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

  /* ====== Accent color extraction ====== */
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

  /* ====== Keyboard shortcuts (Space, ←/→) ====== */
  useEffect(() => {
    if (!isFullScreen) return;
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        // interaction -> make cursor visible + show dock briefly
        setCursorHidden(false);
        setDockVisible(true);
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

  const rgb = useMemo(() => clampRGB(dominantColor), [dominantColor]);
  const bgSolid = `rgb(${rgb})`;
  const bgWithSoftDarken = `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), ${bgSolid}`;

  return (
    <div
      ref={playerRef}
      className={[
        "fixed inset-0 z-[70] flex items-center justify-center overflow-hidden",
        cursorHidden ? "cursor-none" : "cursor-auto", // ⬅️ hide/show cursor
      ].join(" ")}
    >
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

      {/* Smooth slide-up dock */}
      <FullscreenDock
        visible={dockVisible}
        onMouseSafe={(inside) => {
          onMouseSafe(inside);
          // cursor visible while interacting with dock
          setCursorHidden(!inside && !dockVisible);
        }}
      />
    </div>
  );
}
