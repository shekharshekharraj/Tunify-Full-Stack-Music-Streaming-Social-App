import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import { Loader2 } from "lucide-react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "@/stores/useChatStore";

const FeedPage = () => {
  const [feed, setFeed] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { socket, currentUserDb } = useChatStore(); // ⬅️ get current user

  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      try {
        const response = await axiosInstance.get("/activity/feed");
        if (!cancelled) {
          // (defensive) drop any self items just in case
          const meId = currentUserDb?._id;
          const onlyFollowed = meId
            ? response.data.filter((a: Activity) => (a as any).userId?._id !== meId)
            : response.data;
          setFeed(onlyFollowed);
        }
      } catch (error) {
        console.error("Failed to fetch feed", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchFeed();
    return () => {
      cancelled = true;
    };
  }, [currentUserDb?._id]);

  const handleNewActivity = useCallback(
    (activity: Activity) => {
      if (!activity || !activity._id) return;

      // ✅ Ignore my own activity on the client
      const meId = currentUserDb?._id;
      if (meId && (activity as any).userId?._id === meId) return;

      setFeed((prev) => {
        if (prev.length > 0 && prev[0]._id === activity._id) return prev;
        return [activity, ...prev].slice(0, 50);
      });
    },
    [currentUserDb?._id]
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("new_activity", handleNewActivity);
    return () => {
      socket.off("new_activity", handleNewActivity);
    };
  }, [socket, handleNewActivity]);

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)] p-6">
        <h1 className="text-3xl font-bold mb-6 text-white">Activity Feed</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <p className="text-zinc-400 text-center text-lg">
                No recent activity from users you follow.
              </p>
            ) : (
              feed.map((activity) => (
                <div key={activity._id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg shadow-sm">
                  <img
                    src={(activity as any).userId?.imageUrl || "/placeholder-avatar.png"}
                    alt={(activity as any).userId?.fullName || "User"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-zinc-300 text-sm">
                      <span className="font-bold text-white">{(activity as any).userId?.fullName}</span>{" "}
                      listened to{" "}
                      <span className="font-bold text-white">{(activity as any).songId?.title}</span>{" "}
                      by{" "}
                      <span className="font-bold text-white">{(activity as any).songId?.artist}</span>
                    </p>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </main>
  );
};

export default FeedPage;
