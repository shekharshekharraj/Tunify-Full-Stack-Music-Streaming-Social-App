// src/pages/WhatsNew.tsx
import { useEffect, useRef, useState } from "react";
import type { NewRelease } from "@/types/whatsnew";
import { Sparkles, Rocket, Wand2, Bug, Video, Megaphone } from "lucide-react";
import { axiosInstance } from "@/lib/axios"; // try API first
import { Link } from "react-router-dom";

const iconMap: Record<string, JSX.Element> = {
  sparkles: <Sparkles className="h-5 w-5 text-emerald-300" />,
  rocket: <Rocket className="h-5 w-5 text-emerald-300" />,
  wand: <Wand2 className="h-5 w-5 text-emerald-300" />,
  bug: <Bug className="h-5 w-5 text-emerald-300" />,
  video: <Video className="h-5 w-5 text-emerald-300" />,
  megaphone: <Megaphone className="h-5 w-5 text-emerald-300" />,
};

/** ---------------- Demo (hardcoded) data ---------------- **/
const DEMO_UPDATES: NewRelease[] = [
  {
    _id: "demo-1",
    title: "AI Mood Mixes",
    summary:
      "Generate playlists from a vibe—try 'melancholic monsoon' or 'late-night focus'.",
    tags: ["ai", "playlists"],
    icon: "sparkles",
    link: "",
    imageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Headphones close-up",
    pinned: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Tunify Team",
  },
  {
    _id: "demo-2",
    title: "PartyRoom Sync Smoother",
    summary: "Latency cut by ~30% with better auto-recovery if a peer drops.",
    tags: ["party", "reliability"],
    icon: "video",
    link: "",
    imageUrl:
      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Crowd at a show",
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Tunify Team",
  },
  {
    _id: "demo-3",
    title: "Lyrics View 2.0",
    summary: "Smarter karaoke sync and cleaner typography for long verses.",
    tags: ["lyrics", "ux"],
    icon: "megaphone",
    link: "",
    imageUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Stage microphone",
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Tunify Team",
  },
  {
    _id: "demo-4",
    title: "Sleek Full-screen Player",
    summary: "New color engine picks accurate hues from cover art.",
    tags: ["player", "design"],
    icon: "wand",
    link: "",
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Vibrant gradient lights",
    pinned: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Tunify Team",
  },
  {
    _id: "demo-5",
    title: "Performance Pass",
    summary: "Home loads ~45% faster; cache & image optimizations.",
    tags: ["performance", "infra"],
    icon: "rocket",
    link: "",
    imageUrl:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Speed motion lights",
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Tunify Team",
  },
];

/** -------------- Types for API response -------------- **/
type ListResp = {
  ok: boolean;
  pinned: NewRelease[];
  items: NewRelease[];
  nextCursor: string | null;
};

/** -------------- UI Card -------------- **/
const Card = ({ u }: { u: NewRelease }) => {
  const bust = u.updatedAt || u.publishedAt;
  const img = u.imageUrl
    ? `${u.imageUrl}${u.imageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(bust)}`
    : "";

  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition">
      <div className="flex items-start gap-3">
        {/* Thumb / Icon */}
        {u.imageUrl ? (
          <img
            src={img}
            alt={u.imageAlt || u.title}
            className="h-16 w-16 object-cover rounded-lg ring-1 ring-white/10"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-white/10 ring-1 ring-white/10">
            {iconMap[u.icon] ?? iconMap.sparkles}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* top row */}
          <div className="flex items-center gap-2 flex-wrap">
            {u.pinned && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
                pinned
              </span>
            )}
            {u.tags?.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/70 ring-1 ring-white/10"
              >
                {t}
              </span>
            ))}
            <span className="ml-auto text-xs text-white/50">
              {new Date(u.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-1.5 text-sm sm:text-base font-semibold text-white">{u.title}</h3>
          <p className="mt-1 text-sm text-white/80">{u.summary}</p>

          {u.link ? (
            <a
              href={u.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs text-emerald-300 hover:underline"
            >
              Learn more →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/** -------------- Page -------------- **/
export default function WhatsNew() {
  const [pinned, setPinned] = useState<NewRelease[]>([]);
  const [items, setItems] = useState<NewRelease[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bootedRef = useRef(false);

  // Try API → fallback to hardcoded DEMO_UPDATES
  async function loadInitial() {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<ListResp>("/whats-new?limit=20");
      if (data?.ok && (data.items?.length || data.pinned?.length)) {
        setPinned(data.pinned || []);
        setItems(data.items || []);
        setNextCursor(data.nextCursor || null);
      } else {
        setPinned(DEMO_UPDATES.filter((u) => u.pinned));
        setItems(DEMO_UPDATES.filter((u) => !u.pinned));
        setNextCursor(null);
      }
    } catch {
      setPinned(DEMO_UPDATES.filter((u) => u.pinned));
      setItems(DEMO_UPDATES.filter((u) => !u.pinned));
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<ListResp>(
        `/whats-new?limit=20&cursor=${encodeURIComponent(nextCursor)}`
      );
      if (data?.ok) {
        setItems((prev) => [...prev, ...(data.items || [])]);
        setNextCursor(data.nextCursor || null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    loadInitial();

    // Optional SSE live updates (won’t affect demo fallback if backend is absent)
    try {
      const url = new URL("/api/whats-new/stream", window.location.origin);
      const es = new EventSource(url.toString(), { withCredentials: true });

      es.addEventListener("update", (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          const u: NewRelease | undefined = payload?.data;
          if (!u?._id) return;

          if (payload.type === "created") {
            setItems((prev) => [u, ...prev]);
          } else if (payload.type === "updated") {
            setItems((prev) => prev.map((x) => (x._id === u._id ? u : x)));
            setPinned((prev) => prev.map((x) => (x._id === u._id ? u : x)));
          }
        } catch {}
      });

      return () => es.close();
    } catch {
      // no-op
    }
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header with Tunify logo on the left */}
      <header className="mb-6 flex items-center gap-4">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
          aria-label="Back to Home"
        >
          <img
            src="/Tunify.png"
            alt="Tunify"
            className="h-9 w-9 rounded-md ring-1 ring-white/10 shadow-[0_6px_18px_rgba(0,0,0,.35)]"
            draggable={false}
          />
          <span className="sr-only">Tunify Home</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What’s New</h1>
          <p className="text-white/70 mt-1">
            Live product updates, releases, and improvements.
          </p>
        </div>
      </header>

      {/* Pinned */}
      {pinned.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-white/60 mb-3">Pinned</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((u) => (
              <Card key={u._id} u={u} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-white/60 mb-3">Latest</h2>
        <div className="space-y-3">
          {items.map((u) => (
            <Card key={u._id} u={u} />
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          {nextCursor ? (
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          ) : (
            <div className="text-xs text-white/50">You’re all caught up 🎉</div>
          )}
        </div>
      </section>
    </main>
  );
}
