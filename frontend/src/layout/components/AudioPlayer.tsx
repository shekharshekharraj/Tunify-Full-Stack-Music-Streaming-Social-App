// src/components/AudioPlayer.tsx
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSongRef = useRef<string | null>(null);
  const createdRef = useRef(false);

  const {
    currentSong,
    isPlaying,
    playNext,
    repeatMode,
    setAudioNodes,
    audioNodes,
  } = usePlayerStore();

  useEffect(() => {
    let audioEl = document.getElementById("global-audio") as HTMLAudioElement | null;

    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.id = "global-audio";
      audioEl.controls = false;
      audioEl.preload = "metadata";
      try {
        audioEl.crossOrigin = "anonymous";
        audioEl.setAttribute("crossorigin", "anonymous");
      } catch {}
      document.body.appendChild(audioEl);
    } else {
      try {
        audioEl.crossOrigin = "anonymous";
        audioEl.setAttribute("crossorigin", "anonymous");
      } catch {}
    }

    audioRef.current = audioEl;

    if (!createdRef.current) {
      setAudioNodes({
        audioElement: audioEl,
        audioContext: audioNodes?.audioContext ?? null,
        analyser: audioNodes?.analyser ?? null,
        source: audioNodes?.source ?? null,
      });
      createdRef.current = true;
    } else {
      if (!audioNodes?.audioElement) {
        setAudioNodes({ audioElement: audioEl });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = repeatMode === "one";
  }, [repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = () => {
      if (repeatMode === "one") {
        try {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch {}
        return;
      }
      playNext();
    };

    return () => {
      try {
        if (audio) audio.onended = null;
      } catch {}
    };
  }, [playNext, repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {}
      prevSongRef.current = null;
      return;
    }

    const isSongChange = prevSongRef.current !== currentSong.audioUrl;
    if (isSongChange) {
      try {
        audio.crossOrigin = "anonymous";
        audio.setAttribute("crossorigin", "anonymous");
      } catch {}

      audio.src = currentSong.audioUrl;
      audio.currentTime = 0;
      prevSongRef.current = currentSong.audioUrl;

      if (isPlaying) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSong, isPlaying]);

  return null;
};

export default AudioPlayer;
