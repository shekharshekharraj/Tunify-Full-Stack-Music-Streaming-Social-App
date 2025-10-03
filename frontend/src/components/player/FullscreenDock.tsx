import { useRef } from "react";
import { PlaybackControls } from "@/layout/components/PlaybackControls";

/**
 * Glassy dock that hosts the same footer PlaybackControls,
 * positioned inside the FullScreen overlay.
 */
export default function FullscreenDock({
  visible,
  onMouseSafe,
}: {
  visible: boolean;
  onMouseSafe?: (isInside: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => onMouseSafe?.(true)}
      onMouseLeave={() => onMouseSafe?.(false)}
      className={[
        "pointer-events-auto fixed left-0 right-0 bottom-0 z-[80]",
        "flex items-center justify-center",
        "transition-all duration-250 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto w-full max-w-5xl",
          "rounded-xl border border-white/10 bg-black/55 backdrop-blur-xl",
          "shadow-[0_20px_60px_rgba(0,0,0,.35)]",
          "px-4 py-3",
        ].join(" ")}
      >
        {/* Reuse your existing footer controls */}
        <PlaybackControls />
      </div>
    </div>
  );
}
