// src/layout/components/LeftSidebar.tsx
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Home, Sparkles, MessageSquareText, Library, Heart } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const { isSignedIn, user } = useUser();
  const userId = user?.id ?? "";

  const { songs, albums, fetchSongs, fetchAlbums } = useMusicStore();
  const { playAlbum, currentSong, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (albums.length === 0) fetchAlbums().catch(() => {});
  }, [albums.length, fetchAlbums]);

  useEffect(() => {
    if (isSignedIn && songs.length === 0) fetchSongs().catch(() => {});
  }, [isSignedIn, songs.length, fetchSongs]);

  const likedSongs = useMemo(
    () => (userId ? songs.filter((s) => s.likes?.includes(userId)) : []),
    [songs, userId]
  );

  const handlePlayAllLiked = () => {
    if (likedSongs.length) playAlbum(likedSongs, 0);
  };

  const isCurrent = (songId: string) => currentSong?._id === songId && isPlaying;

  return (
    <aside
      className={cn(
        "h-full rounded-xl border border-white/10",
        "bg-[linear-gradient(180deg,rgba(20,20,25,.85)_0%,rgba(12,12,16,.85)_100%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-10px_rgba(0,0,0,0.6)]"
      )}
    >
      {/* Header (icon removed) */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-white font-extrabold tracking-wide">Your Library</span>
            <span className="text-[11px] uppercase tracking-widest text-zinc-400/90">
              Listen. Like. Explore.
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-72px)]">
        <nav className="px-3 py-4 space-y-4">
          {/* Primary nav */}
          <div className="space-y-1">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                "hover:bg-white/8 hover:text-white",
                pathname === "/"
                  ? "bg-white/12 text-white ring-1 ring-white/10"
                  : "text-zinc-300"
              )}
            >
              <Home className="size-4" />
              Home
            </Link>

            <Link
              to="/feed"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                "hover:bg-white/8 hover:text-white",
                pathname === "/feed"
                  ? "bg-white/12 text-white ring-1 ring-white/10"
                  : "text-zinc-300"
              )}
            >
              <Sparkles className="size-4" />
              Feed
            </Link>

            <Link
              to="/chat"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                "hover:bg-white/8 hover:text-white",
                pathname === "/chat"
                  ? "bg-white/12 text-white ring-1 ring-white/10"
                  : "text-zinc-300"
              )}
            >
              <MessageSquareText className="size-4" />
              Chat
            </Link>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

          {/* Library section title */}
          <div className="px-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            <Library className="size-3.5 text-zinc-400/90" />
            Library
          </div>

          {/* Liked Songs */}
          <SignedIn>
            <div className="rounded-lg bg-white/[0.06] ring-1 ring-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center rounded-md bg-gradient-to-br from-rose-500/90 to-fuchsia-600/90 p-1.5 ring-1 ring-white/10">
                    <Heart className="size-4 text-white" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-white">Liked Songs</div>
                    <div className="text-[12px] text-zinc-400">
                      {likedSongs.length} {likedSongs.length === 1 ? "track" : "tracks"}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1 rounded-md font-semibold"
                  onClick={handlePlayAllLiked}
                  disabled={likedSongs.length === 0}
                >
                  Play all
                </Button>
              </div>

              {likedSongs.length > 0 && (
                <ul className="max-h-56 overflow-auto divide-y divide-white/8">
                  {likedSongs.map((s) => (
                    <li key={s._id}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          "hover:bg-white/6",
                          isCurrent(s._id) ? "bg-white/10" : ""
                        )}
                        onClick={() => {
                          const idx = likedSongs.findIndex((x) => x._id === s._id);
                          playAlbum(likedSongs, Math.max(0, idx));
                        }}
                        title={`${s.title} – ${s.artist}`}
                      >
                        <img
                          src={s.imageUrl}
                          alt={s.title}
                          className="size-9 rounded object-cover ring-1 ring-white/10"
                        />
                        <div className="min-w-0 leading-tight">
                          <div className="truncate text-sm text-white font-semibold">
                            {s.title}
                          </div>
                          <div className="truncate text-xs text-zinc-400">{s.artist}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {likedSongs.length === 0 && (
                <div className="px-3 pb-3 text-[12px] text-zinc-400">
                  Tap the{" "}
                  <Heart className="inline size-3 align-text-bottom text-rose-400" /> on a track to
                  add it here.
                </div>
              )}
            </div>
          </SignedIn>

          <SignedOut>
            <div className="rounded-lg bg-white/[0.06] px-3 py-3 text-[12px] text-zinc-400 ring-1 ring-white/10">
              Sign in to see your liked songs here.
            </div>
          </SignedOut>

          {/* Albums (navigation-only) */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Albums
            </div>
            {albums.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-zinc-400/90">No albums yet.</div>
            ) : (
              <ul className="space-y-1">
                {albums.map((album) => (
                  <li key={album._id}>
                    <Link
                      to={`/albums/${album._id}`}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors",
                        "hover:bg-white/6"
                      )}
                      title={`${album.title} – ${album.artist}`}
                    >
                      <div className="size-10 rounded overflow-hidden bg-zinc-800 ring-1 ring-white/10 shrink-0">
                        <img
                          src={album.imageUrl}
                          alt={album.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm text-white font-semibold">
                          {album.title}
                        </div>
                        <div className="truncate text-[12px] text-zinc-400">
                          {album.artist} • {album.songs?.length ?? 0} tracks
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default LeftSidebar;
