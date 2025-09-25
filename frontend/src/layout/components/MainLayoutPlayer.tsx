// src/components/MainLayoutPlayer.tsx
import React, { useEffect, useRef } from "react";
import AudioPlayer from "./AudioPlayer";
import FullScreenPlayer from "./FullScreenPlayer";
import LyricsView from "@/components/LyricsView";
import { PlaybackControls } from "./PlaybackControls";
import { usePlayerStore } from "@/stores/usePlayerStore";

const MainLayoutPlayer: React.FC = () => {
  const { isFullScreen, setAudioNodes } = usePlayerStore();
  const createdRef = useRef(false);

  useEffect(() => {
    let audioEl = document.getElementById("global-audio") as HTMLAudioElement | null;
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.id = "global-audio";
      audioEl.controls = false;
      try { audioEl.crossOrigin = "anonymous"; } catch {}
      document.body.appendChild(audioEl);
    } else {
      try { audioEl.crossOrigin = "anonymous"; } catch {}
    }

    try {
      if (!createdRef.current) {
        const win = window as any;

        let ctx: AudioContext | null = win._GLOBAL_AUDIO_CONTEXT ?? null;
        let source: MediaElementAudioSourceNode | null = win._GLOBAL_MEDIA_SOURCE ?? null;
        let analyser: AnalyserNode | null = win._GLOBAL_ANALYSER ?? null;

        if (!ctx || ctx.state === "closed") {
          ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          win._GLOBAL_AUDIO_CONTEXT = ctx;
        }

        if (!source) {
          source = ctx.createMediaElementSource(audioEl);
          win._GLOBAL_MEDIA_SOURCE = source;
        }

        if (!analyser) {
          analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          win._GLOBAL_ANALYSER = analyser;
        }

        try {
          source.connect(analyser);
          analyser.connect(ctx.destination);
        } catch (e) {
          console.warn("Audio nodes connect warning:", e);
        }

        setAudioNodes({ audioElement: audioEl, audioContext: ctx, analyser, source });
        createdRef.current = true;
        console.log("MainLayoutPlayer: created / registered global audio nodes");
      }
    } catch (err) {
      console.error("MainLayoutPlayer: failed to create global audio nodes", err);
    }
  }, [setAudioNodes]);

  return (
    <>
      <AudioPlayer />
      {isFullScreen && <FullScreenPlayer />}
      <LyricsView />
      <PlaybackControls />
    </>
  );
};

export default MainLayoutPlayer;
