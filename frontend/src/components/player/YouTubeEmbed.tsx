// src/components/player/YouTubeEmbed.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  onReady?: () => void;
};

const YouTubeEmbed: React.FC<Props> = ({ videoId, title = "YouTube Player", autoPlay = true, onReady }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // We can just rely on URL params for autoplay and basic behavior.
    // If you want full JS control, load the IFrame API and interact via postMessage.
    onReady?.();
  }, [onReady]);

  const origin = window.location.origin;
  const url = `https://www.youtube.com/embed/${encodeURIComponent(
    videoId
  )}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(
    origin
  )}`;

  return (
    <div className="relative w-full pt-[56.25%] overflow-hidden rounded-xl ring-1 ring-white/10 bg-black">
      <iframe
        ref={iframeRef}
        title={title}
        src={url}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
