import { useEffect, useRef } from "react";
import { usePlayerStore, resumeAudioContext } from "@/stores/usePlayerStore";

/** Headless audio driver that syncs <audio id="global-audio"> with the store */
export default function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    setCurrentTime,
    playNext,
    repeatMode,
    audioNodes,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el =
      audioNodes?.audioElement ??
      (document.getElementById("global-audio") as HTMLAudioElement | null);
    audioRef.current = el || null;
  }, [audioNodes]);

  // When song changes, set src and play (Cloudinary URL)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = (currentSong as any)?.audioUrl;
    if (!url) return;

    try { audio.crossOrigin = "anonymous"; } catch {}

    if (audio.src !== url) {
      try { audio.src = url; audio.preload = "auto"; } catch {}
    }

    (async () => {
      try {
        await resumeAudioContext(audioNodes?.audioContext);
        if (isPlaying) await audio.play().catch(()=>{});
      } catch {}
    })();
  }, [currentSong?._id, (currentSong as any)?.audioUrl]);

  // Respond to isPlaying toggles
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    (async () => {
      try {
        await resumeAudioContext(audioNodes?.audioContext);
        if (isPlaying) await audio.play();
        else audio.pause();
      } catch {}
    })();
  }, [isPlaying]);

  // Track time + ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = async () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        try { await audio.play(); } catch {}
      } else {
        playNext();
      }
    };
    const onError = () => console.warn("Audio error:", audio.error);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [setCurrentTime, playNext, repeatMode]);

  return null;
}
