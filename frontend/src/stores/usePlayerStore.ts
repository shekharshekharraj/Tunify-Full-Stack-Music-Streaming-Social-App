// src/stores/usePlayerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types";
import { axiosInstance } from "@/lib/axios";
import { useChatStore } from "./useChatStore";

export type RepeatMode = "off" | "queue" | "one";

interface SocketAuth { userId: string; [key: string]: any; }

export type AudioNodes = {
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
  analyser?: AnalyserNode | null;
  source?: MediaElementAudioSourceNode | null;
};

type PartyMeta = {
  id?: string | null;
  title?: string | null;
  artist?: string | null;
  coverUrl?: string | null;
  durationMs?: number | null;
  audioUrl?: string | null;
};

type YouTubeTrack = {
  kind: "youtube";
  id: string;
  videoId: string;
  title: string;
  artist?: string | null;
  imageUrl?: string | null;
  durationMs?: number | null;
};

type YTControl = {
  loadAndPlay?: (id: string) => void;
  play?: () => void;
  pause?: () => void;
  seek?: (t: number) => void;
  setVolume?: (v: number) => void; // 0–100
  getCurrentTime?: () => number;
  getDuration?: () => number;
} | null;

type ActiveSource = "library" | "youtube";

interface PlayerStore {
  // Sources / tracks
  activeSource: ActiveSource;
  currentSong: Song | null;           // library song
  currentYouTube: YouTubeTrack | null; // youtube “track” meta

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void; // ⬅️ NEW: allow external (YT) to drive playing state
  queue: Song[];
  currentIndex: number;
  isFullScreen: boolean;
  showLyrics: boolean;
  currentTime: number;
  repeatMode: RepeatMode;
  dominantColor: string;

  // Dock UI
  showYouTubeDock: boolean;
  setShowYouTubeDock: (open: boolean) => void;
  toggleYouTubeDock: () => void;

  // Engines / nodes
  audioNodes: AudioNodes;
  setAudioNodes: (nodes: AudioNodes) => void;

  // YouTube control bridge
  ytControl: YTControl;
  setYouTubeControl: (c?: YTControl | undefined) => void;

  // Progress helpers used by YT rAF
  pushYouTubeProgress: (current: number, duration?: number) => void;

  // Party follower helper
  setFromPartyMeta: (meta: PartyMeta) => void;

  // Library controls
  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  playSong: (song: Song) => Promise<void>;
  queueSong: (song: Song) => void;

  // YouTube controls
  playTrack: (yt: YouTubeTrack) => Promise<void>;
  queueTrack: (_yt: YouTubeTrack) => void; // (placeholder for future queue UI)

  // Common controls
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleFullScreen: () => void;
  toggleLyrics: () => void;
  setCurrentTime: (time: number) => void;
  toggleRepeatMode: () => void;
  setDominantColor: (color: string) => void;

  // Unified seek
  seekTo?: (t: number) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      // --------- state ----------
      activeSource: "library",
      currentSong: null,
      currentYouTube: null,

      queue: [],
      isPlaying: false,
      setIsPlaying: (v) => set({ isPlaying: v }), // ⬅️ NEW
      currentIndex: -1,
      isFullScreen: false,
      showLyrics: false,
      currentTime: 0,
      repeatMode: "off",
      dominantColor: "20,20,20",

      showYouTubeDock: false,
      setShowYouTubeDock: (open) => set({ showYouTubeDock: open }),
      toggleYouTubeDock: () => set((s) => ({ showYouTubeDock: !s.showYouTubeDock })),

      audioNodes: {},
      setAudioNodes: (nodes) =>
        set((state) => ({ audioNodes: { ...state.audioNodes, ...nodes } })),

      ytControl: null,
      setYouTubeControl: (c) => set({ ytControl: c ?? null }),

      // update store time from YT rAF
      pushYouTubeProgress: (current, _duration) => {
        set({ currentTime: current });
      },

      // --------- party mirror (library meta only) ----------
      setFromPartyMeta: (meta) => {
        const prev = (get().currentSong || {}) as any;
        const merged = {
          ...prev,
          id: meta.id ?? prev.id,
          _id: prev._id ?? meta.id ?? prev._id,
          title: meta.title ?? prev.title,
          name: meta.title ?? prev.name,
          artist: meta.artist ?? prev.artist,
          artists: prev.artists ?? (meta.artist ? [meta.artist] : prev.artists),
          imageUrl: meta.coverUrl ?? prev.imageUrl,
          coverUrl: meta.coverUrl ?? prev.coverUrl,
          image: meta.coverUrl ?? prev.image,
          artworkUrl: meta.coverUrl ?? prev.artworkUrl,
          durationMs: meta.durationMs ?? prev.durationMs,
          duration: meta.durationMs ?? prev.duration,
          audioUrl: meta.audioUrl ?? prev.audioUrl,
        };
        set({ currentSong: merged as Song, activeSource: "library" });
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      toggleLyrics: () => set((s) => ({ showLyrics: !s.showLyrics })),
      toggleFullScreen: () => set((s) => ({ isFullScreen: !s.isFullScreen })),
      setDominantColor: (color) => set({ dominantColor: color }),
      toggleRepeatMode: () => {
        set((s) => {
          if (s.repeatMode === "off") return { repeatMode: "queue" };
          if (s.repeatMode === "queue") return { repeatMode: "one" };
          return { repeatMode: "off" };
        });
      },

      // --------- LIBRARY actions ----------
      initializeQueue: (songs) => {
        set({
          queue: songs,
          currentSong: get().currentSong || songs[0],
          currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
          activeSource: "library",
        });
      },

      playAlbum: (songs, startIndex = 0) => {
        if (songs.length === 0) return;
        const song = songs[startIndex];

        axiosInstance.post("/activity/log-listen", { songId: (song as any)._id }).catch(() => {});

        // activity
        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        // pause YT if needed
        get().ytControl?.pause?.();

        // play audio element
        const audio =
          get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try {
            audio.src = (song as any).audioUrl;
            audio.preload = "auto";
            audio.play().catch(() => {});
          } catch {}
        }

        set({
          queue: songs,
          currentSong: song,
          currentIndex: startIndex,
          isPlaying: true,
          activeSource: "library",
          currentYouTube: null,
        });
      },

      setCurrentSong: (song) => {
        if (!song) return;

        if (get().currentSong?._id !== (song as any)._id) {
          axiosInstance.post("/activity/log-listen", { songId: (song as any)._id }).catch(() => {});
        }

        // activity
        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        // pause YT
        get().ytControl?.pause?.();

        const songIndex = get().queue.findIndex((s) => (s as any)._id === (song as any)._id);
        const audio =
          get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try {
            audio.src = (song as any).audioUrl;
            audio.preload = "auto";
            audio.play().catch(() => {});
          } catch {}
        }

        set({
          currentSong: song,
          isPlaying: true,
          currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
          activeSource: "library",
          currentYouTube: null,
        });
      },

      playSong: async (song) => {
        if (!song) return;

        const { queue } = get();
        let nextQueue = queue;
        let idx = queue.findIndex((s) => (s as any)._id === (song as any)._id);
        if (idx === -1) {
          nextQueue = [...queue, song];
          idx = nextQueue.length - 1;
        }

        try { await axiosInstance.post("/activity/log-listen", { songId: (song as any)._id }); } catch {}

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        // pause YT
        get().ytControl?.pause?.();

        const audio =
          get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);

        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try {
            const ctx = get().audioNodes?.audioContext;
            if (ctx && ctx.state === "suspended") await ctx.resume();
          } catch {}
          try {
            audio.src = (song as any).audioUrl;
            audio.preload = "auto";
            await audio.play();
          } catch {}
        }

        set({
          queue: nextQueue,
          currentSong: song,
          currentIndex: idx === -1 ? 0 : idx,
          isPlaying: true,
          activeSource: "library",
          currentYouTube: null,
        });
      },

      queueSong: (song) => {
        if (!song) return;
        const { queue, currentSong } = get();
        if (queue.some((s) => (s as any)._id === (song as any)._id)) return;
        const nextQueue = [...queue, song];
        set({ queue: nextQueue });
        if (!currentSong) get().playSong(song);
      },

      // --------- YOUTUBE actions ----------
      playTrack: async (yt) => {
        // pause library audio
        const audio =
          get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        try { audio?.pause?.(); } catch {}

        // load & play on YT
        const ctrl = get().ytControl;
        try {
          ctrl?.loadAndPlay?.(yt.videoId);
          ctrl?.play?.();
        } catch {}

        set({
          currentYouTube: yt,
          activeSource: "youtube",
          isPlaying: true,
        });
      },

      queueTrack: (_yt) => {
        // You can maintain your own YT queue later; no-op for now.
      },

      // --------- common controls ----------
      togglePlay: () => {
        const willStartPlaying = !get().isPlaying;
        const source = get().activeSource;

        // activity
        const socket = useChatStore.getState().socket;
        const lib = get().currentSong;
        if (socket?.auth) {
          const auth = (socket.auth as SocketAuth);
          socket.emit("update_activity", {
            userId: auth.userId,
            activity:
              willStartPlaying && lib && source === "library"
                ? `Playing ${lib.title} by ${lib.artist}`
                : willStartPlaying && source === "youtube"
                ? "Playing YouTube"
                : "Idle",
          });
        }

        if (source === "youtube") {
          const yt = get().ytControl;
          if (willStartPlaying) yt?.play?.(); else yt?.pause?.();
        } else {
          const audio =
            get().audioNodes?.audioElement ??
            (document.getElementById("global-audio") as HTMLAudioElement | null);
          if (audio) {
            if (willStartPlaying) audio.play().catch(() => {});
            else audio.pause();
          }
        }

        set({ isPlaying: willStartPlaying });
      },

      playNext: () => {
        // Only for library queue
        if (get().activeSource !== "library") return;
        const { currentIndex, queue, repeatMode } = get();
        const isLastSong = currentIndex === queue.length - 1;

        if (isLastSong && repeatMode !== "queue") {
          set({ isPlaying: false });
          const socket = useChatStore.getState().socket;
          if (socket?.auth) {
            const auth = socket.auth as SocketAuth;
            socket.emit("update_activity", { userId: auth.userId, activity: "Idle" });
          }
          return;
        }

        const nextIndex = isLastSong ? 0 : currentIndex + 1;
        const nextSong = queue[nextIndex];

        axiosInstance.post("/activity/log-listen", { songId: (nextSong as any)._id }).catch(() => {});

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
          });
        }

        const audio =
          get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (nextSong as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try {
            audio.src = (nextSong as any).audioUrl;
            audio.preload = "auto";
            audio.play().catch(() => {});
          } catch {}
        }

        set({ currentSong: nextSong, currentIndex: nextIndex, isPlaying: true, activeSource: "library" });
      },

      playPrevious: () => {
        if (get().activeSource !== "library") return;
        const { currentIndex, queue } = get();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevSong = queue[prevIndex];

          axiosInstance.post("/activity/log-listen", { songId: (prevSong as any)._id }).catch(() => {});

          const socket = useChatStore.getState().socket;
          if (socket?.auth) {
            const auth = socket.auth as SocketAuth;
            socket.emit("update_activity", {
              userId: auth.userId,
              activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
            });
          }

          const audio =
            get().audioNodes?.audioElement ??
            (document.getElementById("global-audio") as HTMLAudioElement | null);
          if (audio && (prevSong as any).audioUrl) {
            try { audio.crossOrigin = "anonymous"; } catch {}
            try {
              audio.src = (prevSong as any).audioUrl;
              audio.preload = "auto";
              audio.play().catch(() => {});
            } catch {}
          }

          set({ currentSong: prevSong, currentIndex: prevIndex, isPlaying: true, activeSource: "library" });
        }
      },

      // unified seek
      seekTo: (t: number) => {
        if (get().activeSource === "youtube") {
          get().ytControl?.seek?.(t);
          set({ currentTime: t });
        } else {
          const audio =
            get().audioNodes?.audioElement ??
            (document.getElementById("global-audio") as HTMLAudioElement | null);
          if (audio) {
            audio.currentTime = t;
            set({ currentTime: t });
          }
        }
      },
    }),
    {
      name: "player-storage",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !["audioNodes"].includes(key))
        ),
    }
  )
);

export async function resumeAudioContext(ctx?: AudioContext | null) {
  if (!ctx) return;
  try { if (ctx.state === "suspended") await ctx.resume(); } catch {}
}
