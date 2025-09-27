// src/layout/components/FriendsActivity.tsx
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { User } from "@/types";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const SkeletonRow = () => (
  <div className="relative rounded-xl p-3 bg-white/[0.03] border border-white/10 overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
      {/* Gradient frame with animated border */}
      <div className="relative h-full rounded-3xl p-[1.5px] bg-[linear-gradient(135deg,rgba(236,72,153,.35),rgba(59,130,246,.35),rgba(16,185,129,.35))] animate-[borderRotate_8s_linear_infinite] [background-size:200%_200%]">
        {/* Glassy interior */}
        <div className="relative h-full rounded-3xl overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-white/10">
          {/* Soft ambient layers */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(900px 420px at 110% -10%, rgba(80,56,160,0.25), rgba(0,0,0,0) 70%),
                radial-gradient(600px 300px at -10% 20%, rgba(236,72,153,0.16), rgba(0,0,0,0) 70%)
              `,
              filter: "blur(16px) saturate(106%)",
            }}
          />

          {/* Header */}
          <div className="relative z-10 px-4 py-4 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-[15px] font-extrabold tracking-wide text-white">Friends Activity</h2>
            <p className="text-xs text-white/60 mt-1">
              Real-time presence & listening updates
            </p>
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online now
                  </div>
                </div>
              )}

              <div className="p-3 space-y-2">
                {decorated.length === 0 ? (
                  <div className="mt-6 text-center text-white/70 text-sm">
                    No other users found.
                  </div>
                ) : (
                  decorated.map(
                    ({ friend, isOnline, isPlayingSong, fullText, songTitle, songArtist }, i) => (
                      <div
                        key={friend.clerkId}
                        className="group relative rounded-2xl p-3 transition-all duration-300 cursor-pointer
                          bg-white/[0.03] hover:bg-white/[0.07]
                          border border-white/10 hover:border-white/20
                          hover:-translate-y-[1px] hover:shadow-[0_6px_24px_-12px_rgba(0,0,0,.6)]
                          will-change-transform"
                        style={{
                          animation: "fadeInUp .5s ease both",
                          animationDelay: `${Math.min(i * 0.04, 0.25)}s`,
                        }}
                        onClick={() => openChat(friend)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="ring-1 ring-white/10">
                              <AvatarImage src={friend.imageUrl} />
                              <AvatarFallback>
                                {friend.fullName?.[0]?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse" />
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
                                  className="h-7 text-[11px] px-2 rounded-md border-white/20 hover:border-white/30"
                                >
                                  {friend.isFollowing ? "Unfollow" : "Follow"}
                                </Button>
                              )}
                            </div>

                            <p
                              className="text-xs text-white/70 mt-0.5 truncate"
                              title={fullText}
                            >
                              {isOnline ? (
                                isPlayingSong ? (
                                  <>
                                    Listening to{" "}
                                    <span className="text-white font-medium">{songTitle}</span>
                                    {songArtist ? (
                                      <span className="opacity-80"> — {songArtist}</span>
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
      </div>

      {/* keyframes (scoped via Tailwind @layer utilities in globals if preferred) */}
      <style>{`
        @keyframes borderRotate {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%) }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </aside>
  );
};

export default FriendsActivity;
