import React, { useEffect, useState } from "react";
import YouTubeEmbed from "./YouTubeEmbed"; // ✅ this uses buildYTUrl under the hood

type Props = {
  open: boolean;
  onClose: () => void;
  videoId: string | null;
  title?: string;
};

const YouTubeModal: React.FC<Props> = ({ open, onClose, videoId, title }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (!open || !videoId) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-4xl mx-4">
        <div className="rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold">{title || "Playing on YouTube"}</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-md px-2 py-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            <YouTubeEmbed videoId={videoId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeModal;
