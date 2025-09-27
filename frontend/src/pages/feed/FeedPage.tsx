// src/pages/feed/FeedPage.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { axiosInstance } from "@/lib/axios";
import { Loader2, Music, User as UserIcon } from "lucide-react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";

const FeedPage = () => {
  const [feed, setFeed] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { socket, currentUserDb } = useChatStore();

  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      try {
        const response = await axiosInstance.get("/activity/feed");
        if (!cancelled) {
          const meId = currentUserDb?._id;
          const onlyOthers = meId
            ? response.data.filter((a: Activity) => (a as any).userId?._id !== meId)
            : response.data;
          setFeed(onlyOthers);
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

  // optional: light formatting for header count
  const countLabel = useMemo(
    () => (feed.length === 1 ? "1 update" : `${feed.length} updates`),
    [feed.length]
  );

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />

      {/* Header band with soft gradient + stats */}
      <div className="px-6 pt-6">
        <div
          className={cn(
            "w-full rounded-xl border border-white/10",
            "bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(244,63,94,.25),rgba(24,24,27,0)_60%),",
            "radial-gradient(900px_420px_at_100%_0%,rgba(255,255,255,.06),rgba(24,24,27,0)_70%)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-10px_rgba(0,0,0,0.6)]"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Activity Feed
              </h1>
              <p className="text-sm text-zinc-300/90 mt-1">{countLabel}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300/90">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
                Live updates
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)] px-6 pb-6 pt-4">
        {isLoading ? (
          <FeedSkeleton />
        ) : feed.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {feed.map((activity) => (
              <li key={activity._id}>
                <FeedCard activity={activity} />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </main>
  );
};

export default FeedPage;

/* ------------------------------ Subcomponents ------------------------------ */

const avatarFallback =
  "data:image/svg+xml,%3Csvg width='96' height='96' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='96' height='96' rx='16' fill='%2326262a'/%3E%3C/svg%3E";

const FeedCard = ({ activity }: { activity: Activity }) => {
  const u = (activity as any).userId;
  const s = (activity as any).songId;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-sm",
        "hover:bg-white/[0.06] transition-colors",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_6px_18px_-8px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* subtle gradient sheen on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0))",
        }}
      />

      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <img
            src={u?.imageUrl || avatarFallback}
            alt={u?.fullName || "User"}
            className="size-12 rounded-full object-cover ring-1 ring-white/15"
          />
          <span className="absolute -bottom-1 -right-1 grid place-items-center size-5 rounded-full bg-emerald-500 ring-2 ring-zinc-900">
            <Music className="size-3 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">{u?.fullName ?? "Someone"}</span>{" "}
            listened to{" "}
            <span className="font-semibold text-white">{s?.title ?? "a track"}</span>{" "}
            by <span className="font-medium text-zinc-200">{s?.artist ?? "Unknown"}</span>
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
            <time className="tabular-nums">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </time>

            {/* song chip */}
            {s?.title && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-[2px] ring-1 ring-white/10">
                <span className="inline-block size-1.5 rounded-full bg-rose-400" />
                {s.title}
              </span>
            )}
          </div>
        </div>

        {/* thumbnail */}
        {s?.title && (
          <div className="hidden sm:block shrink-0">
            <div className="size-14 rounded-md overflow-hidden ring-1 ring-white/10">
              <img
                src={s?.imageUrl || avatarFallback}
                alt={s?.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedSkeleton = () => {
  // simple shimmer skeleton list
  return (
    <ul className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="p-4 flex items-center gap-4">
              <div className="size-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
              <div className="size-14 rounded-md bg-white/10 hidden sm:block" />
            </div>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0)_100%)]" />
          </div>
        </li>
      ))}
      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div className="flex justify-center items-center gap-2 text-zinc-400 pt-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading activity…</span>
      </div>
    </ul>
  );
};

const EmptyState = () => {
  return (
    <div
      className={cn(
        "mx-auto max-w-xl rounded-2xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-sm p-8 text-center",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-10px_rgba(0,0,0,0.6)]"
      )}
    >
      <div className="mx-auto mb-4 grid place-items-center size-14 rounded-full bg-rose-500/20 ring-1 ring-white/10">
        <UserIcon className="size-6 text-rose-400" />
      </div>
      <h2 className="text-lg font-semibold text-white">No recent activity</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Follow people and start listening to see updates here in real time.
      </p>
    </div>
  );
};
