// src/pages/album/AlbumPage.tsx
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const AlbumPage = () => {
  const { albumId } = useParams();
  const { user } = useUser();
  const clerkId = user?.id ?? "";

  const {
    fetchAlbumById,
    currentAlbum,
    isLoading,
    toggleLike,
    commentsBySong,
    fetchComments,
    addComment,
    deleteComment,
  } = useMusicStore();

  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

  const [openForSongId, setOpenForSongId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (albumId) fetchAlbumById(albumId);
  }, [fetchAlbumById, albumId]);

  const handlePlayAlbum = () => {
    if (!currentAlbum) return;
    const isCurrentAlbumPlaying = currentAlbum.songs.some(
      (s) => s._id === currentSong?._id
    );
    if (isCurrentAlbumPlaying) togglePlay();
    else playAlbum(currentAlbum.songs, 0);
  };

  const handlePlaySong = (index: number) => {
    if (!currentAlbum) return;
    playAlbum(currentAlbum.songs, index);
  };

  const openComments = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    setOpenForSongId(songId);
    await fetchComments(songId);
  };

  const submitComment = async () => {
    if (!openForSongId || !commentText.trim()) return;
    await addComment(openForSongId, commentText.trim());
    setCommentText("");
  };

  const isSongLiked = (likes?: string[]) => !!likes?.includes(clerkId);
  const commentsCountFor = (songId: string, fallback?: number) =>
    commentsBySong[songId]?.length ?? fallback ?? 0;

  if (isLoading) return null;

  return (
    <div className="h-full">
      <ScrollArea className="h-full rounded-md">
        <div className="relative min-h-full">
          {/* Ambient background & glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(1200px 520px at 20% -10%, rgba(244,63,94,0.22), rgba(0,0,0,0) 70%),
                radial-gradient(900px 420px at 90% 0%, rgba(80,56,160,0.20), rgba(0,0,0,0) 70%),
                linear-gradient(to bottom, rgba(255,255,255,.04), rgba(0,0,0,0) 55%)
              `,
              filter: "blur(18px) saturate(108%)",
            }}
          />

          {/* Tunify logo link to Home */}
          <Link
            to="/"
            className="absolute z-20 top-4 left-4 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5
                       bg-white/10 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15 transition-colors"
            aria-label="Go to Home"
          >
            <img src="/Tunify.png" alt="Tunify" className="w-7 h-7 rounded-sm" />
            <span className="hidden sm:inline text-white/90 font-semibold tracking-wide">
              Tunify
            </span>
          </Link>

          <div className="relative z-10">
            {/* Header / hero */}
            <div className="p-6">
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-md"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.06), 0 20px 50px -24px rgba(0,0,0,.7)",
                }}
              >
                <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                  <div className="relative shrink-0">
                    <img
                      src={currentAlbum?.imageUrl}
                      alt={currentAlbum?.title}
                      className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-xl object-cover shadow-2xl ring-1 ring-white/15"
                    />
                    {/* subtle shine */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0 self-end">
                    <p className="text-sm font-medium text-white/80">Album</p>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight my-3 sm:my-4">
                      {currentAlbum?.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-100/90">
                      <span className="font-medium text-white">{currentAlbum?.artist}</span>
                      <span className="opacity-70">• {currentAlbum?.songs.length} songs</span>
                      <span className="opacity-70">• {currentAlbum?.releaseYear}</span>
                    </div>

                    {/* Play button */}
                    <div className="mt-6">
                      <Button
                        onClick={handlePlayAlbum}
                        className="h-12 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {isPlaying &&
                        currentAlbum?.songs.some((s) => s._id === currentSong?._id) ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" /> Play
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracklist */}
            <div className="px-6 pb-8">
              <div
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-md"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.06), 0 18px 38px -20px rgba(0,0,0,.65)",
                }}
              >
                {/* header */}
                <div className="grid grid-cols-[16px_4fr_2fr_1fr_140px] gap-4 px-6 py-3 text-xs uppercase tracking-wide text-white/70 border-b border-white/10">
                  <div>#</div>
                  <div>Title</div>
                  <div>Released</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-right pr-1">Actions</div>
                </div>

                {/* rows */}
                <div className="divide-y divide-white/5">
                  {currentAlbum?.songs.map((song, index) => {
                    const liked = isSongLiked(song.likes);
                    const commentsCount = commentsCountFor(
                      song._id,
                      song.comments?.length
                    );

                    const isCurrent = song._id === currentSong?._id && isPlaying;

                    return (
                      <div
                        key={song._id}
                        onClick={() => handlePlaySong(index)}
                        className={`grid grid-cols-[16px_4fr_2fr_1fr_140px] gap-4 px-6 py-3 text-sm
                          hover:bg-white/5 transition-colors cursor-pointer
                          ${isCurrent ? "bg-emerald-500/10" : ""}
                        `}
                      >
                        {/* index / cue */}
                        <div className="flex items-center justify-center">
                          {isCurrent ? (
                            <div className="size-4 text-emerald-400">♫</div>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{index + 1}</span>
                              <Play className="h-4 w-4 hidden group-hover:block" />
                            </>
                          )}
                        </div>

                        {/* title / artist */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="size-10 rounded-md object-cover ring-1 ring-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">
                              {song.title}
                            </div>
                            <div className="text-white/70 truncate">{song.artist}</div>
                          </div>
                        </div>

                        {/* release date */}
                        <div className="flex items-center text-white/70">
                          {song.createdAt?.split("T")[0] || "—"}
                        </div>

                        {/* duration */}
                        <div className="flex items-center text-white/70">
                          {formatDuration(song.duration)}
                        </div>

                        {/* actions */}
                        <div className="flex items-center justify-end gap-3 pr-1">
                          {/* Like (red when liked) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`hover:text-white rounded-full ring-1 ring-white/10
                              ${liked ? "text-red-500 bg-white/10" : "text-white/70"}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(song._id);
                            }}
                            title={liked ? "Unlike" : "Like"}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                liked ? "fill-red-500" : "fill-transparent"
                              }`}
                            />
                          </Button>

                          {/* Counter = # of comments */}
                          <span className="text-xs tabular-nums min-w-[1.5ch] text-white/80">
                            {commentsCount}
                          </span>

                          {/* Open comments dialog */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/70 hover:text-white rounded-full ring-1 ring-white/10"
                            onClick={(e) => openComments(e, song._id)}
                            title="Comments"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* /Tracklist */}
          </div>
        </div>
      </ScrollArea>

      {/* Comments dialog */}
      <Dialog
        open={!!openForSongId}
        onOpenChange={(o) => {
          if (!o) setOpenForSongId(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          className="sm:max-w-lg border border-white/10 bg-zinc-900/90 backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Read and write comments for this song.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {openForSongId &&
              (commentsBySong[openForSongId] ?? []).map((c) => {
                const mine = c.user?.clerkId === clerkId;
                return (
                  <div
                    key={c._id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={c.user.imageUrl}
                      alt={c.user.fullName}
                      className="w-8 h-8 rounded-md object-cover ring-1 ring-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            {c.user.fullName}
                          </div>
                          <div className="text-sm text-white/80 break-words">
                            {c.text}
                          </div>
                        </div>

                        {mine && openForSongId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/70 hover:text-red-500 shrink-0 rounded-full ring-1 ring-white/10"
                            onClick={async () => {
                              await deleteComment(openForSongId, c._id);
                            }}
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {openForSongId &&
              (commentsBySong[openForSongId]?.length ?? 0) === 0 && (
                <div className="text-sm text-white/70">No comments yet.</div>
              )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Textarea
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[44px] bg-white/5 border-white/10"
            />
            <Button
              onClick={submitComment}
              disabled={!commentText.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlbumPage;
