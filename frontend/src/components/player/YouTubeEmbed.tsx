// src/components/player/YouTubeEmbed.tsx
import React, { useEffect } from "react";
import { buildYTUrl } from "@/lib/youtube"; // ✅ uses unified URL logic (supports Render)

type Props = {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  onReady?: () => void;
};

const YouTubeEmbed: React.FC<Props> = ({
  videoId,
  title = "YouTube Player",
  autoPlay = true,
  onReady,
}) => {
  // Call onReady once mounted; iframe itself doesn't expose a ready event without IFrame API
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Base URL from our centralized util (handles www.youtube.com vs nocookie + origin)
  const base = buildYTUrl(videoId);
  const src = `${base}${autoPlay ? "&autoplay=1" : ""}`; // ✅ append autoplay param

  return (
    <div className="relative w-full pt-[56.25%] overflow-hidden rounded-xl ring-1 ring-white/10 bg-black">
      <iframe
        key={videoId} // ✅ force re-mount on id change
        title={title}
        src={src}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
