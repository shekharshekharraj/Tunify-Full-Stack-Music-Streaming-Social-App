// src/layout/components/FriendsActivity.tsx
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { User } from "@/types";
import { useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FriendsActivity: React.FC = () => {
  const { user } = useUser();
  const { users, fetchUsers, onlineUsers, userActivities, setSelectedUser, toggleFollow } =
    useChatStore();
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const loadUsers = async () => {
        setIsLoadingUsers(true);
        await fetchUsers(user.id);
        setIsLoadingUsers(false);
      };
      loadUsers();
    }
  }, [user?.id, fetchUsers]);

  const openChat = (selectedUser: User) => setSelectedUser(selectedUser);

  const handleToggleFollow = async (e: React.MouseEvent, clerkId: string) => {
    e.stopPropagation();
    await toggleFollow(clerkId);
  };

  return (
    <aside className="hidden lg:block h-full w-72 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0">
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-bold p-4 text-white border-b border-zinc-800">
          Friends Activity
        </h2>

        {isLoadingUsers ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {users.length === 0 ? (
                <p className="text-zinc-400 text-center">No other users found.</p>
              ) : (
                users.map((friend) => {
                  // Always key/lookup by clerkId
                  const isOnline = onlineUsers.has(friend.clerkId);
                  const currentActivity = userActivities.get(friend.clerkId);

                  const PLAYING_PREFIX = "Playing ";
                  let songTitle = "";
                  let songArtist = "";
                  let isPlayingSong = false;

                  if (
                    typeof currentActivity === "string" &&
                    currentActivity.startsWith(PLAYING_PREFIX)
                  ) {
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

                  // Full text for native tooltip
                  const fullText = isPlayingSong && isOnline
                    ? `Listening to ${songTitle} - ${songArtist}`
                    : isOnline
                      ? (currentActivity || "Online")
                      : "Offline";

                  return (
                    <div
                      key={friend.clerkId}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors duration-200 group relative"
                      onClick={() => openChat(friend)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.imageUrl} />
                          <AvatarFallback>{friend.fullName?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{friend.fullName}</p>

                        {/* Native tooltip via title attribute */}
                        <p
                          className="text-zinc-400 text-sm truncate"
                          title={fullText}
                        >
                          {isPlayingSong && isOnline ? (
                            <>
                              Listening to{" "}
                              <span className="font-medium text-white">{songTitle}</span> -{" "}
                              {songArtist}
                            </>
                          ) : (
                            <>{fullText}</>
                          )}
                        </p>
                      </div>

                      {friend.clerkId !== user?.id && (
                        <Button
                          onClick={(e) => handleToggleFollow(e, friend.clerkId)}
                          variant={friend.isFollowing ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2"
                        >
                          {friend.isFollowing ? "Unfollow" : "Follow"}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </aside>
  );
};

export default FriendsActivity;
