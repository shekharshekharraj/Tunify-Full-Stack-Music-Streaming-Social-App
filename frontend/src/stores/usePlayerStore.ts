import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types";
import { axiosInstance } from "@/lib/axios";
import { useChatStore } from "./useChatStore";

export type RepeatMode = "off" | "queue" | "one";

interface SocketAuth {
  userId: string;
  [key: string]: any;
}

export type AudioNodes = {
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
  analyser?: AnalyserNode | null;
  source?: MediaElementAudioSourceNode | null;
};

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  isFullScreen: boolean;
  showLyrics: boolean;
  currentTime: number;
  repeatMode: RepeatMode;
  dominantColor: string;

  audioNodes: AudioNodes;
  setAudioNodes: (nodes: AudioNodes) => void;

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;

  playSong: (song: Song) => Promise<void>;
  queueSong: (song: Song) => void;

  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleFullScreen: () => void;
  toggleLyrics: () => void;
  setCurrentTime: (time: number) => void;
  toggleRepeatMode: () => void;
  setDominantColor: (color: string) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      isPlaying: false,
      currentIndex: -1,
      isFullScreen: false,
      showLyrics: false,
      currentTime: 0,
      repeatMode: "off",
      dominantColor: "20,20,20",

      audioNodes: {},
      setAudioNodes: (nodes: AudioNodes) =>
        set((state) => ({ audioNodes: { ...state.audioNodes, ...nodes } })),

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

      initializeQueue: (songs) => {
        set({
          queue: songs,
          currentSong: get().currentSong || songs[0],
          currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
        });
      },

      playAlbum: (songs, startIndex = 0) => {
        if (songs.length === 0) return;
        const song = songs[startIndex];

        axiosInstance.post("/activity/log-listen", { songId: (song as any)._id }).catch(() => {});

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        const audio = get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try { audio.src = (song as any).audioUrl; audio.preload = "auto"; audio.play().catch(()=>{}); } catch {}
        }

        set({ queue: songs, currentSong: song, currentIndex: startIndex, isPlaying: true });
      },

      setCurrentSong: (song) => {
        if (!song) return;

        if (get().currentSong?._id !== (song as any)._id) {
          axiosInstance.post("/activity/log-listen", { songId: (song as any)._id }).catch(() => {});
        }

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        const songIndex = get().queue.findIndex((s) => (s as any)._id === (song as any)._id);

        const audio = get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try { audio.src = (song as any).audioUrl; audio.preload = "auto"; audio.play().catch(()=>{}); } catch {}
        }

        set({
          currentSong: song,
          isPlaying: true,
          currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
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

        const audio = get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);

        if (audio && (song as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try {
            const ctx = get().audioNodes?.audioContext;
            if (ctx && ctx.state === "suspended") await ctx.resume();
          } catch {}
          try { audio.src = (song as any).audioUrl; audio.preload = "auto"; await audio.play(); } catch {}
        }

        set({
          queue: nextQueue,
          currentSong: song,
          currentIndex: idx === -1 ? 0 : idx,
          isPlaying: true,
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

      togglePlay: () => {
        const willStartPlaying = !get().isPlaying;
        const currentSong = get().currentSong;
        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity:
              willStartPlaying && currentSong
                ? `Playing ${currentSong.title} by ${currentSong.artist}`
                : "Idle",
          });
        }

        const audio = get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio) {
          if (willStartPlaying) audio.play().catch(()=>{});
          else audio.pause();
        }

        set({ isPlaying: willStartPlaying });
      },

      playNext: () => {
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

        const audio = get().audioNodes?.audioElement ??
          (document.getElementById("global-audio") as HTMLAudioElement | null);
        if (audio && (nextSong as any).audioUrl) {
          try { audio.crossOrigin = "anonymous"; } catch {}
          try { audio.src = (nextSong as any).audioUrl; audio.preload = "auto"; audio.play().catch(()=>{}); } catch {}
        }

        set({ currentSong: nextSong, currentIndex: nextIndex, isPlaying: true });
      },

      playPrevious: () => {
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

          const audio = get().audioNodes?.audioElement ??
            (document.getElementById("global-audio") as HTMLAudioElement | null);
          if (audio && (prevSong as any).audioUrl) {
            try { audio.crossOrigin = "anonymous"; } catch {}
            try { audio.src = (prevSong as any).audioUrl; audio.preload = "auto"; audio.play().catch(()=>{}); } catch {}
          }

          set({ currentSong: prevSong, currentIndex: prevIndex, isPlaying: true });
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
