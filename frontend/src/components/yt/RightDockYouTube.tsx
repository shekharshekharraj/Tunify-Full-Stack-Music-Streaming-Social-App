// src/components/RightDockYouTube.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Youtube, Sparkles, Loader2, Play, Plus } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { ytSearchApi, ytSuggestApi, YTResult } from "@/lib/ytmusic";
import { cn } from "@/lib/utils";
import {
  loadYouTubeAPI,
  buildPlayerVars,
  pickAndSanitizeId,
  isValidVideoId,
  getBestYouTubeThumb,
} from "@/lib/youtube";

/* ---------- Safe display helpers ---------- */
function safeText(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(safeText).filter(Boolean).join(", ");
  if (typeof v === "object") return v.name ?? v.title ?? v.text ?? "";
  return "";
}
function safeArtist(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.name ?? "")).filter(Boolean).join(", ");
  if (typeof v === "object") return v.name ?? "";
  return "";
}

export default function RightDockYouTube() {
  const { showYouTubeDock, setShowYouTubeDock, currentSong } = usePlayerStore();
  const seedQuery =
    (currentSong ? `${currentSong.title ?? ""} ${currentSong.artist ?? ""}` : "").trim() || "believer";

  return (
    <DockInner
      open={showYouTubeDock}
      onClose={() => setShowYouTubeDock(false)}
      seedQuery={seedQuery}
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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);

  const pendingCmds = useRef<Array<() => void>>([]);
  const drain = useCallback(() => {
    while (pendingCmds.current.length) {
      const fn = pendingCmds.current.shift();
      try { fn?.(); } catch (e) { console.warn("[YT] pending command failed:", e); }
    }
  }, []);

  const {
    setYouTubeControl,
    pushYouTubeProgress,
    playTrack,
    setIsPlaying,
    currentYouTube,
    currentSong,
  } = usePlayerStore();

  const [q, setQ] = useState(seedQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YTResult[]>([]);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [currentVid, setCurrentVid] = useState<{ id: string; title?: string } | null>(null);

  const lastTriedIndexRef = useRef<number | null>(null);
  const tryingFallbackRef = useRef(false);
  const AUTOPLAY_RELATED = true; // always on

  /* ---------- Seeds / defaults ---------- */
  useEffect(() => {
    if (open) setQ(seedQuery);
  }, [seedQuery, open]);

  useEffect(() => {
    if (!currentSong && !q) setQ("believer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong]);

  /* ---------- IFrame API (kept alive even when dock hidden) ---------- */
  useEffect(() => {
    let cancelled = false;
    let ytInstance: any;

    (async () => {
      try {
        const YT = await loadYouTubeAPI();
        if (cancelled || !mountRef.current) return;

        ytInstance = new YT.Player(mountRef.current, {
          height: "100%",
          width: "100%",
          playerVars: buildPlayerVars(origin),
          events: {
            onReady: () => {
              if (cancelled) return;
              setApiReady(true);
              playerRef.current = ytInstance;

              if (isValidVideoId(currentVid?.id)) {
                try { ytInstance.cueVideoById(currentVid!.id); } catch {}
              }

              setYouTubeControl({
                loadAndPlay: (id: string) => {
                  if (!isValidVideoId(id)) return console.warn("[YT] invalid id -> loadAndPlay ignored:", id);
                  ytInstance.loadVideoById(id);
                },
                play: () => ytInstance.playVideo?.(),
                pause: () => ytInstance.pauseVideo?.(),
                seek: (t: number) => ytInstance.seekTo?.(t, true),
                setVolume: (v: number) => ytInstance.setVolume?.(v),
                getCurrentTime: () => ytInstance.getCurrentTime?.() ?? 0,
                getDuration: () => ytInstance.getDuration?.() ?? 0,
              });

              drain();
            },
            onStateChange: (ev: any) => {
              const state = ev?.data;
              if (state === 1 /* PLAYING */) {
                const audio = document.getElementById("global-audio") as HTMLAudioElement | null;
                audio?.pause?.(); // avoid overlap
                setIsPlaying(true);
              }
              if (state === 2 /* PAUSED */) {
                setIsPlaying(false);
              }
              if (state === 0 /* ENDED */) {
                setIsPlaying(false);
                if (AUTOPLAY_RELATED) {
                  void autoPlayNextRelated();
                }
              }
            },
            onError: (e: any) => {
              console.warn("[YT] player error:", e);
              const code = e?.data;
              if ((code === 150 || code === 101) && !tryingFallbackRef.current) {
                // try next playable from results if current is blocked
                const currentIndex =
                  lastTriedIndexRef.current ??
                  (results.findIndex((r) => pickAndSanitizeId(r) === currentVid?.id) || 0);

                const next = results
                  .slice((currentIndex ?? 0) + 1)
                  .map((r) => ({ id: pickAndSanitizeId(r), r }))
                  .find((x) => isValidVideoId(x.id));

                if (next?.id) {
                  tryingFallbackRef.current = true;
                  setCurrentVid({ id: next.id, title: safeText(next.r.title) });
                  try {
                    playerRef.current?.loadVideoById(next.id);
                    playerRef.current?.playVideo?.();
                  } finally {
                    setTimeout(() => { tryingFallbackRef.current = false; }, 300);
                  }
                } else if (AUTOPLAY_RELATED) {
                  // if none in results, run radio fallback
                  void autoPlayNextRelated();
                }
              }
            },
          },
        });
      } catch (e) {
        console.warn("[YT] Failed to init API:", e);
      }
    })();

    return () => {
      // Destroy when app leaves/unmounts
      setApiReady(false);
      setYouTubeControl(undefined);
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
      pendingCmds.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, setYouTubeControl]);

  /* ---------- Progress pump ---------- */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerRef.current;
      if (p?.getPlayerState?.() === 1 /* PLAYING */) {
        pushYouTubeProgress(p.getCurrentTime?.() ?? 0, p.getDuration?.() ?? undefined);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pushYouTubeProgress]);

  /* ---------- Search & Suggestions ---------- */
  const doSearch = useCallback(async (query = q) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await ytSearchApi(query, "songs", 18);
      setResults(r);

      if (!currentVid) {
        const first = r.find((x) => isValidVideoId(pickAndSanitizeId(x)));
        const id = first ? pickAndSanitizeId(first) : null;
        if (isValidVideoId(id)) setCurrentVid({ id: id!, title: safeText(first?.title) });
      }
    } finally {
      setLoading(false);
    }
  }, [q, currentVid]);

  useEffect(() => {
    if (results.length === 0) void doSearch();
  }, [results.length, doSearch]);

  useEffect(() => {
    let cancel = false;
    if (!q.trim()) {
      setSuggests([]);
      return;
    }
    ytSuggestApi(q).then((s) => !cancel && setSuggests(s.slice(0, 10)));
    return () => { cancel = true; };
  }, [q]);

  /* ---------- Play clicked result (HD art) ---------- */
  const playNow = async (r: YTResult) => {
    const vid = pickAndSanitizeId(r);
    if (!isValidVideoId(vid)) {
      console.warn("[YT] No valid videoId in result", r);
      return;
    }

    const title = safeText(r.title);
    const artist = safeArtist((r as any).artist);

    setCurrentVid({ id: vid!, title });
    lastTriedIndexRef.current = results.findIndex((x) => x === r);

    const hdThumb =
      (await getBestYouTubeThumb(vid!)) ||
      (r as any).coverUrl ||
      (r as any).thumbnails?.[0]?.url ||
      undefined;

    await playTrack({
      kind: "youtube",
      id: r.id,
      videoId: vid!,
      title,
      artist,
      imageUrl: hdThumb,
      durationMs: (r as any).durationMs ?? undefined,
    });

    const exec = () => {
      try {
        playerRef.current?.loadVideoById(vid!);
        playerRef.current?.playVideo?.();
      } catch (e) {
        console.warn("[YT] Failed to play video", e);
      }
    };

    if (!apiReady || !playerRef.current) pendingCmds.current.push(exec);
    else exec();
  };

  /* ---------- Auto-play “radio” when current video ends ---------- */
  const autoPlayNextRelated = useCallback(async () => {
    // 1) try the next item in the current results
    const curId = currentYouTube?.videoId || currentVid?.id || null;
    let curIdx = results.findIndex((r) => pickAndSanitizeId(r) === curId);
    if (curIdx < 0) curIdx = lastTriedIndexRef.current ?? -1;

    const candidateFromResults = results
      .slice(curIdx + 1)
      .map((r) => ({ id: pickAndSanitizeId(r), r }))
      .find((x) => isValidVideoId(x.id));

    if (candidateFromResults?.id) {
      await playNow(candidateFromResults.r);
      return;
    }

    // 2) fallback: ask YT for suggestions based on current title/artist
    const seedTitle = currentYouTube?.title || currentVid?.title || "";
    const seedArtist = currentYouTube?.artist || "";
    const query = [seedTitle, seedArtist].filter(Boolean).join(" ").trim() || q || "music";

    try {
      const sug = await ytSuggestApi(query);
      // search using first suggestion that yields playable results
      for (const s of sug.slice(0, 5)) {
        const res = await ytSearchApi(s, "songs", 18);
        const playable = res.find((x) => isValidVideoId(pickAndSanitizeId(x)));
        if (playable) {
          setResults(res); // new list becomes our queue base
          await playNow(playable);
          return;
        }
      }
    } catch (e) {
      console.warn("[YT] radio fallback failed:", e);
    }

    // 3) ultimate fallback: reuse the current query
    try {
      const res = await ytSearchApi(query, "songs", 18);
      const playable = res.find((x) => isValidVideoId(pickAndSanitizeId(x)));
      if (playable) {
        setResults(res);
        await playNow(playable);
      }
    } catch (e) {
      console.warn("[YT] radio ultimate fallback failed:", e);
    }
  }, [results, q, currentVid?.id, currentVid?.title, currentYouTube?.videoId, currentYouTube?.title, currentYouTube?.artist]);

  /* ---------- UI / Panel ---------- */
  const panelClasses = useMemo(
    () =>
      cn(
        "fixed right-3 top-[88px] z-[100] w-[360px] lg:w-[400px]",
        "transition-[transform,opacity] duration-300",
        open ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"
      ),
    [open]
  );

  return createPortal(
    <aside aria-hidden={!open} className={panelClasses}>
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

        {/* Player root */}
        <div className="aspect-video bg-black">
          <div ref={mountRef} className="h-full w-full" />
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

          {/* Suggestions */}
          {suggests.length > 0 && (
            <div className="mt-2 relative">
              <div
                className={cn(
                  "flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain",
                  "h-7 pl-1 pr-1",
                  "[scrollbar-width:none] [-ms-overflow-style:none]"
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {suggests.map((s) => (
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
            results.map((r) => {
              const title = safeText(r.title);
              const artist = safeArtist((r as any).artist);
              return (
                <div
                  key={`${r.type}-${r.id}`}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-2"
                  title={title}
                >
                  <div className="flex gap-2 items-center">
                    <img
                      src={(r as any).coverUrl || "/placeholder.png"}
                      alt={title}
                      className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{title}</div>
                      <div className="truncate text-xs text-white/70">{artist}</div>
                    </div>

                    <button
                      onClick={() => playNow(r)}
                      className="inline-flex items-center gap-1 h-8 px-2 rounded-md bg-emerald-500/90 text-white text-[12px] border border-emerald-300/40"
                      title="Play now"
                    >
                      <Play className="size-3.5" />
                      Play
                    </button>

                    <button
                      onClick={() => {}}
                      className="inline-flex items-center gap-1 h-8 px-2 rounded-md bg-white/10 text-white text-[12px] border border-white/15"
                      title="Add to queue"
                    >
                      <Plus className="size-3.5" />
                      Queue
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>,
    document.body
  );
}
