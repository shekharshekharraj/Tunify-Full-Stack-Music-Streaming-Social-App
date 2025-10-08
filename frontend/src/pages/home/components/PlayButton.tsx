import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import { Pause, Play } from "lucide-react";

const PlayButton = ({ song }: { song: Song }) => {
  // Select only what you need; pull *both* potential APIs
  const currentSong   = usePlayerStore((s) => s.currentSong);
  const isPlaying     = usePlayerStore((s) => s.isPlaying);
  const togglePlay    = usePlayerStore((s) => s.togglePlay);
  const setCurrentRaw = usePlayerStore((s) => (s as any).setCurrentSong);
  const playSongRaw   = usePlayerStore((s) => (s as any).playSong);

  const isCurrentSong = currentSong?._id === song._id;

  const handlePlay = async () => {
    if (isCurrentSong) {
      togglePlay();
      return;
    }
    // Prefer setCurrentSong when available, otherwise fall back to playSong
    if (typeof setCurrentRaw === "function") {
      setCurrentRaw(song);
      return;
    }
    if (typeof playSongRaw === "function") {
      await playSongRaw(song);
      return;
    }
    // Last resort: log once to help debug if neither function exists
    console.error(
      "PlayButton: no compatible store method found. Expected setCurrentSong or playSong on usePlayerStore."
    );
  };

  return (
    <Button
      size="icon"
      onClick={handlePlay}
      className={`absolute bottom-3 right-2 bg-green-500 hover:bg-green-400 hover:scale-105 transition-all 
        opacity-0 translate-y-2 group-hover:translate-y-0 ${
          isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
    >
      {isCurrentSong && isPlaying ? (
        <Pause className="size-5 text-black" />
      ) : (
        <Play className="size-5 text-black" />
      )}
    </Button>
  );
};

export default PlayButton;
