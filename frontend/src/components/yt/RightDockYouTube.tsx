// src/components/RightDockYouTube.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X, Youtube, Sparkles, Loader2, Play, Plus } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { ytSearchApi, ytSuggestApi, YTResult } from "@/lib/ytmusic";
import { cn } from "@/lib/utils";

// All YT helpers from one place
import {
  loadYouTubeAPI,
  buildPlayerVars,
  pickAndSanitizeId,
  isValidVideoId,
} from "@/lib/youtube";

declare global {
  interface Window {
    YT: any;
  }
}

/* ---------------- Display sanitizers (prevent React from crashing) ---------------- */
function safeText(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(safeText).filter(Boolean).join(", ");
  if (typeof v === "object") {
    // common shapes: { name }, { title }, { text }
    return v.name ?? v.title ?? v.text ?? "";
  }
  return "";
}
function safeArtist(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    // could be array of strings or {name}
    return v.map((x) => (typeof x === "string" ? x : x?.name ?? "")).filter(Boolean).join(", ");
  }
  if (typeof v === "object") return v.name ?? "";
  return "";
}

export default function RightDockYouTube() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const { showYouTubeDock, setShowYouTubeDock, currentSong } = usePlayerStore();

  const seedQuery = (currentSong ? `${currentSong.title ?? ""} ${currentSong.artist ?? ""}` : "").trim();

  if (!onHome) return null;

  return (
    <DockInner
      open={showYouTubeDock}
      onClose={() => setShowYouTubeDock(false)}
      seedQuery={seedQuery || "believer"}
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

  // Queue commands if user clicks before the iframe is ready
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
    setIsPlaying, // keep isPlaying in sync with iframe
  } = usePlayerStore();

  const [q, setQ] = useState(seedQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YTResult[]>([]);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [currentVid, setCurrentVid] = useState<{ id: string; title?: string } | null>(null);

  // for error-150 recovery: try next playable once per event
  const lastTriedIndexRef = useRef<number | null>(null);
  const tryingFallbackRef = useRef(false);

  // keep query in sync when panel opens
  useEffect(() => {
    if (open) setQ(seedQuery);
  }, [seedQuery, open]);

  // ---------- Init YT API + player ONCE (keep alive even when dock is closed) ----------
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

              // attach ref first so queued cmds can run
              playerRef.current = ytInstance;

              // If a video is already selected, cue it (don’t restart)
              if (isValidVideoId(currentVid?.id)) {
                try { ytInstance.cueVideoById(currentVid!.id); } catch {}
              }

              // expose controls to the global store
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

              // Pause your global <audio> tag to prevent overlap
              if (state === 1 /* PLAYING */) {
                const audio = document.getElementById("global-audio") as HTMLAudioElement | null;
                audio?.pause?.();
                setIsPlaying(true);
              }
              if (state === 2 /* PAUSED */ || state === 0 /* ENDED */) {
                setIsPlaying(false);
              }
            },
            onError: (e: any) => {
              console.warn("[YT] player error:", e);
              const code = e?.data;
              // 150/101: owner disabled embedding / playback not allowed
              if ((code === 150 || code === 101) && !tryingFallbackRef.current) {
                // try to pick next playable in current results
                const currentIndex =
                  lastTriedIndexRef.current ??
                  (results.findIndex((r) => pickAndSanitizeId(r) === currentVid?.id) || 0);

                const next = results
                  .slice((currentIndex ?? 0) + 1)
                  .map((r) => ({ id: pickAndSanitizeId(r), r }))
                  .find((x) => isValidVideoId(x.id));

                if (next?.id) {
                  tryingFallbackRef.current = true;
                  console.warn("[YT] error 150/101, trying fallback:", next.id);
                  setCurrentVid({ id: next.id, title: safeText(next.r.title) });
                  try {
                    playerRef.current?.loadVideoById(next.id);
                    playerRef.current?.playVideo?.();
                  } finally {
                    setTimeout(() => { tryingFallbackRef.current = false; }, 300);
                  }
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
      // Destroy only when component unmounts (NOT when panel is closed)
      cancelled = true;
      setApiReady(false);
      setYouTubeControl(undefined);
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
      pendingCmds.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, setYouTubeControl]);
  // ----------------------------------------------------------------------

  // Progress pump (sync time into store for global seek bar) — keep running even when dock is hidden
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

  // Do search (when opened first time or seed changes)
  const doSearch = useCallback(async (query = q) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await ytSearchApi(query, "songs", 18);
      setResults(r);

      // preselect first playable if nothing chosen yet (validate!)
      if (!currentVid) {
        const first = r.find((x) => isValidVideoId(pickAndSanitizeId(x)));
        const id = first ? pickAndSanitizeId(first) : null;
        if (isValidVideoId(id)) setCurrentVid({ id: id!, title: safeText(first?.title) });
      }
    } finally {
      setLoading(false);
    }
  }, [q, currentVid]);

  // Kick a search when the dock opens and we have nothing yet
  useEffect(() => {
    if (open && results.length === 0) void doSearch();
  }, [open, results.length, doSearch]);

  // suggestions
  useEffect(() => {
    let cancel = false;
    if (!q.trim()) {
      setSuggests([]);
      return;
    }
    ytSuggestApi(q).then((s) => !cancel && setSuggests(s.slice(0, 10)));
    return () => { cancel = true; };
  }, [q]);

  // Clicking a search result: update store + ensure play after readiness
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

    // Reflect in global store (active source = youtube; pauses audio via store)
    await playTrack({
      kind: "youtube",
      id: r.id,
      videoId: vid!,
      title,
      artist,
      imageUrl: (r as any).coverUrl ?? (r as any).thumbnails?.[0]?.url,
      durationMs: (r as any).durationMs ?? undefined,
    });

    const exec = () => {
      try {
        playerRef.current?.loadVideoById(vid!);
        playerRef.current?.playVideo?.(); // user gesture: allowed
      } catch (e) {
        console.warn("[YT] Failed to play video", e);
      }
    };

    if (!apiReady || !playerRef.current) pendingCmds.current.push(exec);
    else exec();
  };

  const panelClasses = useMemo(
    () =>
      cn(
        "fixed right-3 top-[88px] z-40 w-[360px] lg:w-[400px]",
        "transition-[transform,opacity] duration-300",
        open ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"
      ),
    [open]
  );

  return (
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
    </aside>
  );
}
