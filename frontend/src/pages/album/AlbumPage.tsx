// src/pages/albums/AlbumPage.tsx
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(s / 60);
  const remainingSeconds = s % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const PLAYER_H = 96; // keep in sync with your player bar

const AlbumPage = () => {
  const { albumId } = useParams();
  const { fetchAlbumById, currentAlbum, isLoading } = useMusicStore();
  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

  useEffect(() => {
    if (albumId) fetchAlbumById(albumId);
  }, [fetchAlbumById, albumId]);

  const isCurrentAlbumPlaying = useMemo(() => {
    if (!currentAlbum || !currentSong) return false;
    return currentAlbum.songs.some((s) => s._id === currentSong._id);
  }, [currentAlbum, currentSong]);

  const handlePlayAlbum = () => {
    if (!currentAlbum) return;
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playAlbum(currentAlbum.songs, 0);
    }
  };

  const handlePlaySong = (index: number) => {
    if (!currentAlbum) return;
    playAlbum(currentAlbum.songs, index);
  };

  // Simple loading guard
  if (isLoading || !currentAlbum) {
    return (
      <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
        <Topbar />
        <div className="h-[calc(100vh-180px)] flex items-center justify-center">
          <div className="text-zinc-400">Loading album…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      {/* Show Tunify here only */}
      <Topbar />

      {/* Page body: give room for the bottom player */}
      <div className="relative" style={{ minHeight: `calc(100vh - 180px)`, paddingBottom: PLAYER_H }}>
        {/* Background gradient “hero” layer */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80 to-zinc-900 pointer-events-none"
          aria-hidden="true"
        />

        {/* Foreground content */}
        <div className="relative z-10">
          {/* Hero header */}
          <div className="flex p-6 gap-6 pb-8">
            <img
              src={currentAlbum.imageUrl}
              alt={currentAlbum.title}
              className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] shadow-xl rounded object-cover"
            />
            <div className="flex flex-col justify-end min-w-0">
              <p className="text-sm font-medium">Album</p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold my-3 sm:my-4 truncate">
                {currentAlbum.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100">
                <span className="font-medium text-white">{currentAlbum.artist}</span>
                <span>• {currentAlbum.songs.length} songs</span>
                {currentAlbum.releaseYear && <span>• {currentAlbum.releaseYear}</span>}
              </div>
            </div>
          </div>

          {/* Play button */}
          <div className="px-6 pb-4 flex items-center gap-6">
            <Button
              onClick={handlePlayAlbum}
              size="icon"
              aria-label={isCurrentAlbumPlaying && isPlaying ? "Pause album" : "Play album"}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all"
            >
              {isCurrentAlbumPlaying && isPlaying ? (
                <Pause className="h-7 w-7 text-black" />
              ) : (
                <Play className="h-7 w-7 text-black" />
              )}
            </Button>
          </div>

          {/* Tracks */}
          <div className="bg-black/20 backdrop-blur-sm">
            {/* Header row */}
            <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-10 py-2 text-sm text-zinc-400 border-b border-white/5">
              <div>#</div>
              <div>Title</div>
              <div>Released Date</div>
              <div>
                <Clock className="h-4 w-4" />
              </div>
            </div>

            {/* Scrollable list (independent of page scroll) */}
            <ScrollArea className="max-h-[calc(100vh-360px)]">
              <div className="px-6">
                <div className="space-y-2 py-4">
                  {currentAlbum.songs.map((song, index) => {
                    const isCurrentSong = currentSong?._id === song._id;
                    const createdDate =
                      (song as any)?.createdAt
                        ? new Date((song as any).createdAt).toISOString().split("T")[0]
                        : "—";

                    return (
                      <div
                        key={song._id}
                        onClick={() => handlePlaySong(index)}
                        className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-md group cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handlePlaySong(index)}
                        aria-label={`Play ${song.title} by ${song.artist}`}
                      >
                        <div className="flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <div className="size-4 text-green-500">♫</div>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{index + 1}</span>
                              {!isCurrentSong && <Play className="h-4 w-4 hidden group-hover:block" />}
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="size-10 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">{song.title}</div>
                            <div className="truncate">{song.artist}</div>
                          </div>
                        </div>

                        <div className="flex items-center">{createdDate}</div>
                        <div className="flex items-center">{formatDuration(song.duration)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AlbumPage;
