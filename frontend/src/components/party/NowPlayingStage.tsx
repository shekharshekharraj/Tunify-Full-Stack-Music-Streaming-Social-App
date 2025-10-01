import { useEffect, useState } from "react";
import type { PartyTrack } from "@/hooks/usePartySync";
import ColorThief from "colorthief";

type Props = {
  track: PartyTrack | null;
  isPlaying: boolean;
  positionMs: number;
};

function formatMs(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function luminance([r, g, b]: [number, number, number]) {
  const toLin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export default function NowPlayingStage({ track, isPlaying, positionMs }: Props) {
  const durationMs = track?.durationMs || 0;
  const progressPct = durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  const title = track?.title || "Nothing playing";
  const artist = track?.artist || "";
  const cover = track?.coverUrl || "";

  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({
    background: "linear-gradient(0deg, rgba(24,24,27,0.45), rgba(24,24,27,0.45))",
  });

  useEffect(() => {
    if (!cover) {
      setBgStyle({
        background: "linear-gradient(0deg, rgba(24,24,27,0.45), rgba(24,24,27,0.45))",
      });
      return;
    }
    // offscreen image for ColorThief; OK if CORS blocks it—we keep the image but skip the tint
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cover;

    img.onload = () => {
      try {
        const thief = new ColorThief();
        const [r, g, b] = thief.getColor(img) as [number, number, number];
        const lum = luminance([r, g, b]);
        const overlay = lum > 0.6 ? 0.35 : lum > 0.45 ? 0.28 : 0.18;
        const gradient = `
          radial-gradient(60% 100% at 10% 0%, rgba(${r}, ${g}, ${b}, ${overlay}) 0%, rgba(${r}, ${g}, ${b}, 0.08) 60%, rgba(0,0,0,0) 100%),
          linear-gradient(0deg, rgba(${r}, ${g}, ${b}, ${overlay}) 0%, rgba(${r}, ${g}, ${b}, ${overlay}) 100%)
        `;
        setBgStyle({ background: gradient });
      } catch {
        setBgStyle({
          background: "linear-gradient(0deg, rgba(24,24,27,0.45), rgba(24,24,27,0.45))",
        });
      }
    };
    img.onerror = () => {
      setBgStyle({
        background: "linear-gradient(0deg, rgba(24,24,27,0.45), rgba(24,24,27,0.45))",
      });
    };
  }, [cover]);

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={bgStyle}>
      <div className="flex items-center gap-6 p-6 bg-black/30 rounded-xl border border-white/10 backdrop-blur-sm">
        {/* Artwork */}
        <div className="w-28 h-28 rounded-md overflow-hidden ring-1 ring-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
          {cover ? (
            <img
              src={cover}
              alt={title ? `Cover of ${title}` : "Cover"}
              className="w-full h-full object-cover"
              draggable={false}
              decoding="async"
              // IMPORTANT: no crossOrigin here—let the image load even if CDN lacks CORS
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div className="text-zinc-500 text-xs select-none">No Art</div>
          )}
        </div>

        {/* Meta + progress */}
        <div className="min-w-[18rem] max-w-[36rem]">
          <div className="text-white text-lg font-semibold truncate" title={title}>
            {title}
          </div>
          {artist ? (
            <div className="text-zinc-300 text-sm truncate" title={artist}>
              {artist}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">—</div>
          )}

          <div className="mt-3">
            <div className="h-2 w-full bg-white/10 rounded overflow-hidden">
              <div
                className={`h-2 rounded bg-emerald-400 transition-[width] ${
                  isPlaying ? "duration-300" : "duration-500"
                } ease-linear`}
                style={{ width: `${progressPct}%` }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
                role="progressbar"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-300">
              <span>{formatMs(positionMs)}</span>
              <span>{formatMs(durationMs)}</span>
            </div>
          </div>

          <div className="mt-1 text-xs text-zinc-400" aria-live="polite" aria-atomic="true">
            {isPlaying ? "Playing" : "Paused"}
          </div>
        </div>
      </div>
    </div>
  );
}
