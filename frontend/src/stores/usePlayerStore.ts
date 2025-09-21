import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";

export type RepeatMode = "off" | "queue" | "one";

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

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	currentSong: null,
	isPlaying: false,
	queue: [],
	currentIndex: -1,
	isFullScreen: false, // --- THE FIX IS HERE --- Ensure this is 'false'
	showLyrics: false,
	currentTime: 0,
	repeatMode: "off",
	dominantColor: "20,20,20",

	setCurrentTime: (time: number) => {
		set({ currentTime: time });
	},

	toggleLyrics: () => {
		set((state) => ({ showLyrics: !state.showLyrics }));
	},

	toggleFullScreen: () => {
		set((state) => ({ isFullScreen: !state.isFullScreen }));
	},

	toggleRepeatMode: () => {
		set((state) => {
			if (state.repeatMode === "off") {
				return { repeatMode: "queue" };
			}
			if (state.repeatMode === "queue") {
				return { repeatMode: "one" };
			}
			return { repeatMode: "off" };
		});
	},
    
	setDominantColor: (color: string) => {
		set({ dominantColor: color });
	},

	initializeQueue: (songs: Song[]) => {
		set({
			queue: songs,
			currentSong: get().currentSong || songs[0],
			currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
		});
	},

	playAlbum: (songs: Song[], startIndex = 0) => {
		if (songs.length === 0) return;
		const song = songs[startIndex];
		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}
		set({ queue: songs, currentSong: song, currentIndex: startIndex, isPlaying: true });
	},

	setCurrentSong: (song: Song | null) => {
		if (!song) return;
		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
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
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : "Idle",
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
			if (socket.auth) {
				socket.emit("update_activity", { userId: socket.auth.userId, activity: `Idle` });
			}
			return;
		}
		
		const nextIndex = isLastSong ? 0 : currentIndex + 1;
		const nextSong = queue[nextIndex];

		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
			});
		}

		set({
			currentSong: nextSong,
			currentIndex: nextIndex,
			isPlaying: true,
		});
	},

	playPrevious: () => {
		const { currentIndex, queue } = get();
		const prevIndex = currentIndex - 1;
		if (prevIndex >= 0) {
			const prevSong = queue[prevIndex];
			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
				});
			}
			set({ currentSong: prevSong, currentIndex: prevIndex, isPlaying: true });
		} else {
			set({ isPlaying: false });
			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", { userId: socket.auth.userId, activity: `Idle` });
			}
		}
	},
}));