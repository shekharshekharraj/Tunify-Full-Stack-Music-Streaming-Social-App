// src/pages/yt/YouTubeSearchPanel.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ytSearchApi, ytSuggestApi, YTResult } from "@/lib/ytmusic";
import YouTubeModal from "@/components/player/YouTubeModal";
import { Search, Sparkles, Film, Music2, User2, ListMusic, Loader2, Play, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "songs" | "videos" | "albums" | "artists" | "playlists";

const TABS: Array<{ key: TabType; label: string; icon: React.ReactNode }> = [
  { key: "songs", label: "Songs", icon: <Music2 className="size-4" /> },
  { key: "videos", label: "Videos", icon: <Film className="size-4" /> },
  { key: "albums", label: "Albums", icon: <ListMusic className="size-4" /> },
  { key: "artists", label: "Artists", icon: <User2 className="size-4" /> },
  { key: "playlists", label: "Playlists", icon: <ListMusic className="size-4" /> },
];

const SUGGEST_COLORS = [
  "from-fuchsia-500/25 to-violet-500/25",
  "from-emerald-500/25 to-teal-500/25",
  "from-sky-500/25 to-indigo-500/25",
  "from-rose-500/25 to-orange-500/25",
];

const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex gap-3">
      <div className="h-16 w-16 rounded-lg bg-white/10 ring-1 ring-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ q }: { q: string }) => (
  <div className="mx-auto max-w-md text-center">
    <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
      <Youtube className="size-7 text-white/80" />
    </div>
    <h3 className="mt-4 text-lg font-semibold">No results</h3>
    <p className="mt-1 text-sm text-white/70">
      We couldn’t find anything for <span className="font-medium text-white">“{q}”</span>. Try different terms or another category.
    </p>
  </div>
);

const ResultCard = ({
  r,
  onPlay,
}: {
  r: YTResult;
  onPlay: (id: string, title?: string) => void;
}) => (
  <div
    className={cn(
      "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3",
      "transition hover:-translate-y-[1px] hover:bg-white/[0.06] hover:border-white/20",
      "hover:shadow-[0_14px_40px_-20px_rgba(0,0,0,.65)]"
    )}
  >
    {/* Ambient glow on hover */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background:
          "radial-gradient(400px 120px at 20% -10%, rgba(99,102,241,.14), transparent 70%), radial-gradient(400px 120px at 110% 120%, rgba(236,72,153,.12), transparent 70%)",
      }}
    />
    <div className="relative z-10 flex gap-3">
      <div className="relative">
        <img
          src={r.coverUrl || "/placeholder.png"}
          alt={r.title}
          className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
          loading="lazy"
          decoding="async"
        />
        {r.videoId && (
          <button
            onClick={() => onPlay(r.videoId!, r.title)}
            className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-full bg-black/70 ring-1 ring-white/20 backdrop-blur hover:bg-black/80"
            title="Play on YouTube"
          >
            <Play className="size-3.5 text-white" />
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{r.title}</div>
        <div className="truncate text-xs text-white/70">{r.artist}</div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">{r.type}</div>

        {r.videoId && (
          <button
            onClick={() => onPlay(r.videoId!, r.title)}
            className="mt-2 inline-flex h-8 items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-500/90 px-3 text-xs font-semibold text-white transition hover:brightness-105"
          >
            <Play className="size-3.5" />
            Play on YouTube
          </button>
        )}
      </div>
    </div>
  </div>
);

const YouTubeSearchPanel: React.FC = () => {
  const [q, setQ] = useState("believer");
  const [type, setType] = useState<TabType>("songs");
  const [results, setResults] = useState<YTResult[]>([]);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [playing, setPlaying] = useState<{ id: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    try {
      const data = await ytSearchApi(q, type, 20);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  // initial
  useEffect(() => {
    void doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // suggestions
  useEffect(() => {
    let cancelled = false;
    if (!q.trim()) {
      setSuggests([]);
      return;
    }
    ytSuggestApi(q).then((s) => !cancelled && setSuggests(s.slice(0, 6)));
    return () => {
      cancelled = true;
    };
  }, [q]);

  // ✅ Option A: stable callback so children don't re-render unnecessarily
  const onPlay = useCallback((id: string, title?: string) => {
    setPlaying({ id, title });
  }, []);

  const headerSubtitle = useMemo(() => {
    switch (type) {
      case "songs":
        return "Find tracks you love and jump right in.";
      case "videos":
        return "Official videos, live performances, and more.";
      case "albums":
        return "Browse full albums and essentials.";
      case "artists":
        return "Discover artists and their top songs.";
      case "playlists":
        return "Curated playlists and mixes.";
    }
  }, [type]);

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pb-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur">
        {/* ambient gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1000px 400px at 0% -10%, rgba(236,72,153,0.16), transparent 70%), radial-gradient(1000px 400px at 120% 120%, rgba(14,165,233,0.16), transparent 70%)",
            filter: "blur(18px) saturate(110%)",
          }}
        />

        <div className="relative z-10 grid gap-4 p-5 sm:p-7">
          {/* Top row: Tunify logo + title + sparkle */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group relative grid size-9 place-items-center rounded-xl ring-1 ring-white/10 bg-white/5 overflow-hidden"
              aria-label="Go to Home"
              title="Tunify Home"
            >
              <img src="/Tunify.png" alt="Tunify logo" className="h-6 w-6 rounded-md" draggable={false} />
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-400/0 group-hover:bg-emerald-400/5 transition" />
            </Link>

            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">YouTube Music Explorer</h1>

            <div className="ml-1 grid size-8 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Sparkles className="size-4 text-emerald-300" />
            </div>
          </div>

          <p className="max-w-2xl text-sm text-white/70">{headerSubtitle}</p>

          {/* Search + Tabs */}
          <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search songs, artists, albums…"
                className={cn(
                  "h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-28 text-sm outline-none",
                  "ring-0 transition placeholder:text-white/40",
                  "focus:border-white/20"
                )}
              />
              <button
                onClick={doSearch}
                disabled={loading}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 items-center gap-2 rounded-lg",
                  "border border-emerald-300/40 bg-emerald-500/90 px-3 text-xs font-semibold text-white",
                  "transition hover:brightness-105 disabled:opacity-60"
                )}
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-[13px] font-semibold transition",
                    "ring-1 ring-white/10",
                    type === t.key ? "bg-white/15 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {suggests.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {suggests.map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    setQ(s);
                    setTimeout(() => void doSearch(), 0);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-white/10 bg-gradient-to-r px-3 py-1 text-xs text-white/90 transition",
                    "hover:brightness-[1.1]",
                    SUGGEST_COLORS[i % SUGGEST_COLORS.length]
                  )}
                  title={`Search “${s}”`}
                >
                  <Sparkles className="size-3.5" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RESULTS */}
      <section className="mt-6">
        {loading && results.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : results.length === 0 ? (
          <div className="py-12">
            <EmptyState q={q} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <ResultCard key={`${r.type}-${r.id}`} r={r} onPlay={onPlay} />
            ))}
          </div>
        )}
      </section>

      {/* MODAL PLAYER */}
      <YouTubeModal
        open={!!playing}
        onClose={() => setPlaying(null)}
        videoId={playing?.id || null}
        title={playing?.title || "YouTube"}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%) }
        }
      `}</style>
    </main>
  );
};

export default YouTubeSearchPanel;
