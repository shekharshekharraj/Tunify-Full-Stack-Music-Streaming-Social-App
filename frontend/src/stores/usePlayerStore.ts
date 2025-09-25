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

/** Audio nodes object stored in Zustand so multiple components can reuse it */
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

  // audio node sharing
  audioNodes: AudioNodes;
  setAudioNodes: (nodes: AudioNodes) => void;

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
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

      // audio nodes initial state
      audioNodes: {},
      setAudioNodes: (nodes: AudioNodes) =>
        set((state) => ({ audioNodes: { ...state.audioNodes, ...nodes } })),

      setCurrentTime: (time) => set({ currentTime: time }),

      toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),

      toggleFullScreen: () =>
        set((state) => ({ isFullScreen: !state.isFullScreen })),

      setDominantColor: (color) => set({ dominantColor: color }),

      toggleRepeatMode: () => {
        set((state) => {
          if (state.repeatMode === "off") return { repeatMode: "queue" };
          if (state.repeatMode === "queue") return { repeatMode: "one" };
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

        axiosInstance.post("/activity/log-listen", { songId: song._id });

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        set({ queue: songs, currentSong: song, currentIndex: startIndex, isPlaying: true });
      },

      setCurrentSong: (song) => {
        if (!song) return;

        if (get().currentSong?._id !== song._id) {
          axiosInstance.post("/activity/log-listen", { songId: song._id });
        }

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        const songIndex = get().queue.findIndex((s) => s._id === song._id);
        set({
          currentSong: song,
          isPlaying: true,
          currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
        });
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

        axiosInstance.post("/activity/log-listen", { songId: nextSong._id });

        const socket = useChatStore.getState().socket;
        if (socket?.auth) {
          const auth = socket.auth as SocketAuth;
          socket.emit("update_activity", {
            userId: auth.userId,
            activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
          });
        }

        set({ currentSong: nextSong, currentIndex: nextIndex, isPlaying: true });
      },

      playPrevious: () => {
        const { currentIndex, queue } = get();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevSong = queue[prevIndex];

          axiosInstance.post("/activity/log-listen", { songId: prevSong._id });

          const socket = useChatStore.getState().socket;
          if (socket?.auth) {
            const auth = socket.auth as SocketAuth;
            socket.emit("update_activity", {
              userId: auth.userId,
              activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
            });
          }
          set({ currentSong: prevSong, currentIndex: prevIndex, isPlaying: true });
        }
      },
    }),
    {
      name: "player-storage",
      // Do not persist audioNodes (browser objects)
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !["audioNodes"].includes(key))
        ),
    }
  )
);

/** Helper to safely resume an AudioContext (fixes playback after auth redirects) */
export async function resumeAudioContext(ctx?: AudioContext | null) {
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {}
}
