// src/layout/components/FriendsActivity.tsx
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { User } from "@/types";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const SkeletonRow = () => (
  <div className="relative rounded-xl p-3 bg-black/30 border border-white/10 overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-2 w-2/3 rounded bg-white/10" />
      </div>
      <div className="h-7 w-16 rounded bg-white/10" />
    </div>
  </div>
);

const FriendsActivity: React.FC = () => {
  const { user } = useUser();
  const { users, fetchUsers, onlineUsers, userActivities, setSelectedUser, toggleFollow } =
    useChatStore();
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setIsLoadingUsers(true);
      await fetchUsers(user.id);
      setIsLoadingUsers(false);
    })();
  }, [user?.id, fetchUsers]);

  const decorated = useMemo(
    () =>
      users.map((friend) => {
        const isOnline = onlineUsers.has(friend.clerkId);
        const currentActivity = userActivities.get(friend.clerkId);

        const PLAYING_PREFIX = "Playing ";
        let songTitle = "";
        let songArtist = "";
        let isPlayingSong = false;

        if (typeof currentActivity === "string" && currentActivity.startsWith(PLAYING_PREFIX)) {
          isPlayingSong = true;
          const songInfo = currentActivity.substring(PLAYING_PREFIX.length);
          const byIndex = songInfo.lastIndexOf(" by ");
          if (byIndex !== -1) {
            songTitle = songInfo.substring(0, byIndex);
            songArtist = songInfo.substring(byIndex + 4);
          } else {
            songTitle = songInfo;
          }
        }

        const fullText =
          isPlayingSong && isOnline
            ? `Listening to ${songTitle} - ${songArtist}`
            : isOnline
            ? currentActivity || "Online"
            : "Offline";

        return { friend, isOnline, isPlayingSong, fullText, songTitle, songArtist };
      }),
    [users, onlineUsers, userActivities]
  );

  const openChat = (selectedUser: User) => setSelectedUser(selectedUser);
  const handleToggleFollow = async (e: React.MouseEvent, clerkId: string) => {
    e.stopPropagation();
    await toggleFollow(clerkId);
  };

  return (
    <aside className="hidden lg:block h-full w-[300px] flex-shrink-0">
      {/* Matte black shell */}
      <div className="relative h-full rounded-3xl border border-white/10 bg-black/60">
        {/* Subtle inner glow + hairlines */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/5" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,.04),inset_0_-1px_0_rgba(0,0,0,.6)]" />

        {/* Header */}
        <div className="relative z-10 px-4 py-4 border-b border-white/10 bg-black/40">
          <h2 className="text-[15px] font-extrabold tracking-wide text-white">Friends Activity</h2>
          <p className="text-xs text-white/55 mt-1">Presence, listening & quick follow</p>
        </div>

        {/* Body */}
        {isLoadingUsers ? (
          <div className="relative z-10 p-3 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <ScrollArea className="relative z-10 h-[calc(100%-76px)]">
            {/* Online strip */}
            {decorated.some((d) => d.isOnline) && (
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online now
                </div>
              </div>
            )}

            <div className="p-3 space-y-2">
              {decorated.length === 0 ? (
                <div className="mt-6 text-center text-white/65 text-sm">No other users found.</div>
              ) : (
                decorated.map(
                  ({ friend, isOnline, isPlayingSong, fullText, songTitle, songArtist }, i) => (
                    <div
                      key={friend.clerkId}
                      className={`
                        group relative rounded-2xl p-3 transition-all duration-300 cursor-pointer
                        bg-black/35 hover:bg-black/55
                        border border-white/10 hover:border-white/20
                        hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,.8)]
                        will-change-transform
                      `}
                      style={{
                        animation: "fadeInUp .45s ease both",
                        animationDelay: `${Math.min(i * 0.04, 0.22)}s`,
                      }}
                      onClick={() => openChat(friend)}
                    >
                      {/* Left accent on hover */}
                      <span className="pointer-events-none absolute inset-y-2 left-2 w-[3px] rounded bg-white/0 group-hover:bg-white/30 transition" />

                      <div className="flex items-center gap-3 pl-1">
                        <div className="relative shrink-0">
                          <Avatar className="ring-1 ring-white/10 shadow-[0_6px_20px_rgba(0,0,0,.5)]">
                            <AvatarImage src={friend.imageUrl} />
                            <AvatarFallback>
                              {friend.fullName?.[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-white truncate">
                              {friend.fullName}
                            </p>

                            {friend.clerkId !== user?.id && (
                              <Button
                                onClick={(e) => handleToggleFollow(e, friend.clerkId)}
                                variant={friend.isFollowing ? "secondary" : "outline"}
                                size="sm"
                                className={`
                                  h-7 text-[11px] px-2 rounded-md border-white/15
                                  hover:border-white/25
                                  ${friend.isFollowing ? "bg-white/10 text-white" : "bg-transparent text-white/90"}
                                `}
                              >
                                {friend.isFollowing ? "Unfollow" : "Follow"}
                              </Button>
                            )}
                          </div>

                          <p className="text-xs text-white/65 mt-0.5 truncate" title={fullText}>
                            {isOnline ? (
                              isPlayingSong ? (
                                <>
                                  <span className="text-white/70">Listening to</span>{" "}
                                  <span className="text-white font-medium">{songTitle}</span>
                                  {songArtist ? (
                                    <span className="opacity-70"> — {songArtist}</span>
                                  ) : null}
                                </>
                              ) : (
                                <>{fullText}</>
                              )
                            ) : (
                              <>Offline</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%) }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </aside>
  );
};

export default FriendsActivity;
