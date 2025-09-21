import AudioPlayer from "./AudioPlayer";
import FullScreenPlayer from "./FullScreenPlayer";
import LyricsView from "@/components/LyricsView";
import { PlaybackControls } from "./PlaybackControls";
import { usePlayerStore } from "@/stores/usePlayerStore";

const MainLayoutPlayer = () => {
	const { isFullScreen } = usePlayerStore();

	return (
		<>
			{/* The Audio element needs to exist for the player to work */}
			<AudioPlayer />
			
			{/* Conditionally render the FullScreenPlayer as an overlay */}
			{isFullScreen && <FullScreenPlayer />}

			{/* The LyricsView and PlaybackControls are always part of the layout */}
			<LyricsView />
			<PlaybackControls />
		</>
	);
};

export default MainLayoutPlayer;