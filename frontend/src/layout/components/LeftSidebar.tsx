// src/components/LeftSidebar.tsx
import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { SignedIn, useUser } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle, Rss } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const LeftSidebar = () => {
  const { albums, fetchAlbums, isLoading } = useMusicStore();
  const { isSignedIn } = useUser();
  const location = useLocation();

  useEffect(() => {
    if (isSignedIn) fetchAlbums();
  }, [fetchAlbums, isSignedIn]);

  const isLinkActive = (path: string) => location.pathname === path;

  return (
    // ⬇️ Ensure the column itself can shrink; ScrollArea gets full height
    <div className="h-full min-h-0 overflow-hidden">
      <ScrollArea className="h-full p-2 pr-3">
        <div className="rounded-lg bg-zinc-900 p-2 mb-2">
          <div className="space-y-1">
            <Link
              to={"/"}
              className={cn(
                buttonVariants({ variant: "ghost", className: "w-full justify-start text-white hover:bg-zinc-800" }),
                isLinkActive("/") && "bg-zinc-800"
              )}
            >
              <HomeIcon className="mr-2 size-5" />
              <span className="hidden md:inline">Home</span>
            </Link>

            <SignedIn>
              <Link
                to={"/chat"}
                className={cn(
                  buttonVariants({ variant: "ghost", className: "w-full justify-start text-white hover:bg-zinc-800" }),
                  isLinkActive("/chat") && "bg-zinc-800"
                )}
              >
                <MessageCircle className="mr-2 size-5" />
                <span className="hidden md:inline">Messages</span>
              </Link>
              <Link
                to={"/feed"}
                className={cn(
                  buttonVariants({ variant: "ghost", className: "w-full justify-start text-white hover:bg-zinc-800" }),
                  isLinkActive("/feed") && "bg-zinc-800"
                )}
              >
                <Rss className="mr-2 size-5" />
                <span className="hidden md:inline">Feed</span>
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="rounded-lg bg-zinc-900 p-2">
          <div className="flex items-center text-white px-2 mb-2">
            <Library className="size-5 mr-2" />
            <span className="hidden md:inline">Your Library</span>
          </div>

        {/* the long list */}
          <div className="space-y-1 pb-4">
            <SignedIn>
              {isLoading ? (
                <PlaylistSkeleton />
              ) : (
                albums.map((album) => (
                  <Link
                    to={`/albums/${album._id}`}
                    key={album._id}
                    className={cn(
                      "p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer",
                      location.pathname === `/albums/${album._id}` && "bg-zinc-800"
                    )}
                  >
                    <img
                      src={album.imageUrl}
                      alt="Album Art"
                      className="size-12 rounded-md flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="font-medium truncate text-white">{album.title}</p>
                      <p className="text-sm text-zinc-400 truncate">Album • {album.artist}</p>
                    </div>
                  </Link>
                ))
              )}
            </SignedIn>
          </div>
        </div>

        {/* Always render a vertical scrollbar for shadcn/ui ScrollArea */}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default LeftSidebar;
