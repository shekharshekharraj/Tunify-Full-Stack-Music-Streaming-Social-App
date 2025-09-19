import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevSongRef = useRef<string | null>(null);

	const { currentSong, isPlaying, playNext } = usePlayerStore();

	// handle play/pause logic
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handlePlay = async () => {
			try {
				await audio.play();
			} catch (error: any) {
				// We can safely ignore the AbortError, as it's expected.
				if (error.name !== "AbortError") {
					console.error("Audio playback error:", error);
				}
			}
		};

		if (isPlaying) {
			handlePlay();
		} else {
			audio.pause();
		}
	}, [isPlaying]);

	// handle song ends
	useEffect(() => {
		const audio = audioRef.current;
		const handleEnded = () => playNext();
		audio?.addEventListener("ended", handleEnded);
		return () => audio?.removeEventListener("ended", handleEnded);
	}, [playNext]);

	// handle song changes
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		const handlePlay = async () => {
			try {
				await audio.play();
			} catch (error: any) {
				if (error.name !== "AbortError") {
					console.error("Audio playback error on song change:", error);
				}
			}
		};

		const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
		if (isSongChange) {
			audio.src = currentSong?.audioUrl;
			audio.currentTime = 0;
			prevSongRef.current = currentSong?.audioUrl;

			if (isPlaying) {
				handlePlay();
			}
		}
	}, [currentSong, isPlaying]);

	return <audio ref={audioRef} />;
};
export default AudioPlayer;