import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { ytSearchApi, ytSuggestApi, YTResult } from "@/lib/ytmusic";
import { X, Youtube, Sparkles, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const buildYTUrl = (id: string) => {
  const base = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
  const qs = new URLSearchParams({
    autoplay: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    origin: window.location.origin,
  });
  return `${base}?${qs.toString()}`;
};

export default function RightDockYouTube() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const { showYouTubeDock, setShowYouTubeDock, currentSong } = usePlayerStore();

  if (!onHome) return null;

  return (
    <DockInner
      open={showYouTubeDock}
      onClose={() => setShowYouTubeDock(false)}
      seedQuery={currentSong ? `${currentSong.title} ${currentSong.artist}` : ""}
    />
  );
}

function DockInner({
  open,
  onClose,
  seedQuery,
}: {
  open: boolean;
  onClose: () => void;
  seedQuery: string;
}) {
  const [q, setQ] = useState(seedQuery || "believer");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YTResult[]>([]);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [currentVid, setCurrentVid] = useState<{ id: string; title?: string } | null>(null);

  useEffect(() => {
    if (seedQuery && open) setQ(seedQuery);
  }, [seedQuery, open]);

  const doSearch = async (query = q) => {
    setLoading(true);
    try {
      const r = await ytSearchApi(query, "songs", 18);
      setResults(r);
      const first = r.find((x) => x.videoId);
      if (first && !currentVid) setCurrentVid({ id: first.videoId!, title: first.title });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    if (!q.trim()) {
      setSuggests([]);
      return;
    }
    ytSuggestApi(q).then((s) => !cancel && setSuggests(s.slice(0, 8)));
    return () => {
      cancel = true;
    };
  }, [q]);

  useEffect(() => {
    if (open) void doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "fixed right-3 top-[88px] z-40 w-[360px] lg:w-[400px]",
        "transition-[transform,opacity] duration-300",
        open ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl",
          "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col",
          "max-h-[calc(100vh-120px)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
          <div className="grid size-7 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
            <Youtube className="size-4 text-white/80" />
          </div>
          <div className="text-sm font-semibold">Mini Player</div>
          <button
            onClick={onClose}
            className="ml-auto grid size-8 place-items-center rounded-md hover:bg-white/5 text-white/80"
            aria-label="Close YouTube panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Player */}
        <div className="aspect-video bg-black">
          {currentVid?.id ? (
            <iframe
              key={currentVid.id}
              src={buildYTUrl(currentVid.id)}
              title={currentVid.title || "YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-white/60 text-sm">
              No video selected
            </div>
          )}
        </div>

        {/* Search */}
        <div className="p-3 border-t border-white/10">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Search YouTube…"
              className="w-full h-9 rounded-lg bg-white/5 border border-white/10 pl-9 pr-24 text-sm outline-none"
            />
            <Sparkles className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-white/50" />
            <button
              onClick={() => doSearch()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md bg-emerald-500/90 text-white text-xs font-semibold border border-emerald-300/40"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* ⭐ Suggestions (compact) */}
          {suggests.length > 0 && (
            <div className="mt-2 relative">
              <span className="pointer-events-none absolute left-0 top-0 h-7 w-6 bg-gradient-to-r from-zinc-950/80 to-transparent rounded-l-md" />
              <span className="pointer-events-none absolute right-0 top-0 h-7 w-6 bg-gradient-to-l from-zinc-950/80 to-transparent rounded-r-md" />
              <div
                className={cn(
                  "flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain",
                  "h-7 pl-1 pr-1",
                  "[scrollbar-width:none] [-ms-overflow-style:none]"
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.scrollLeft += e.deltaY;
                  }
                }}
              >
                {suggests.slice(0, 10).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQ(s);
                      setTimeout(() => void doSearch(s), 0);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-white/10",
                      "px-2.5 h-7 text-[11px] text-white/90 whitespace-nowrap",
                      "bg-gradient-to-r hover:brightness-[1.1]"
                    )}
                    title={`Search “${s}”`}
                  >
                    <Sparkles className="size-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="overflow-auto px-3 pb-3 space-y-2">
          {loading && results.length === 0 ? (
            <div className="py-8 text-center text-white/60 text-sm">Searching…</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-white/60 text-sm">No results</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => r.videoId && setCurrentVid({ id: r.videoId, title: r.title })}
                className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition p-2"
                title={r.title}
              >
                <div className="flex gap-2">
                  <img
                    src={r.coverUrl || "/placeholder.png"}
                    alt={r.title}
                    className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="truncate text-xs text-white/70">{r.artist}</div>
                    {r.videoId && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300">
                        <Play className="size-3" /> Play
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
