import Topbar from "@/components/Topbar";
import LeftSidebar from "@/layout/components/LeftSidebar";
import FriendsActivity from "@/layout/components/FriendsActivity";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useMemo, useRef, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import SearchResults from "./components/SearchResults";
import { SignedIn, useUser } from "@clerk/clerk-react";

const MAX_FEATURED = 8;
const MAX_MADE_FOR_YOU = 8;
const MAX_TRENDING = 8;
const RESHUFFLE_MS = 30000; // 20s cadence

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- helpers for very smooth RGB tween ----
const parseRGB = (rgb: string): [number, number, number] => {
  const [r, g, b] = rgb.split(",").map((n) => Math.max(0, Math.min(255, Number(n) || 0)));
  return [r, g, b];
};
const toRGB = (t: [number, number, number]) =>
  `${Math.round(t[0])},${Math.round(t[1])},${Math.round(t[2])}`;
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// Default light red baseline (rose-ish)
const DEFAULT_RGB = "244,63,94";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tick, setTick] = useState(0); // drives periodic reshuffle

  const {
    songs,
    fetchSongs,
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    isLoading,
    madeForYouSongs,
    trendingSongs,
    featuredSongs,
  } = useMusicStore();

  // ⬇️ removed isPlaying from here
  const { initializeQueue, dominantColor} = usePlayerStore();
  const { isSignedIn } = useUser();

  // color coming from card hover (rgb string "r,g,b" or null to clear)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // the current glow color we render (tweened)
  const [displayColor, setDisplayColor] = useState<string>(DEFAULT_RGB);
  const tweenRef = useRef<number | null>(null);

  // Pick active target in this priority: hoveredColor → dominantColor → default
  const activeTargetRGB = hoveredColor ?? dominantColor ?? DEFAULT_RGB;

  // Smooth RGB tween whenever the active target color changes
  useEffect(() => {
    const target = parseRGB(activeTargetRGB);
    const start = parseRGB(displayColor);

    if (tweenRef.current) cancelAnimationFrame(tweenRef.current);

    const DURATION = 1200; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / DURATION);
      const e = easeInOut(t);

      const cur: [number, number, number] = [
        start[0] + (target[0] - start[0]) * e,
        start[1] + (target[1] - start[1]) * e,
        start[2] + (target[2] - start[2]) * e,
      ];

      setDisplayColor(toRGB(cur));
      if (t < 1) {
        tweenRef.current = requestAnimationFrame(step);
      } else {
        tweenRef.current = null;
      }
    };

    tweenRef.current = requestAnimationFrame(step);
    return () => {
      if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
      tweenRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTargetRGB]);

  // initial data fetch
  useEffect(() => {
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
    if (isSignedIn) fetchSongs();
  }, [isSignedIn, fetchSongs, fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  // seed queue once songs exist
  useEffect(() => {
    if (songs.length > 0) initializeQueue(songs);
  }, [initializeQueue, songs]);

  // reshuffle heartbeat
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), RESHUFFLE_MS);
    return () => clearInterval(id);
  }, []);

  // search
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [searchQuery, songs]);

  // dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // reshuffled slices (depend on tick to change periodically)
  const dynamicFeatured = useMemo(
    () => shuffle(featuredSongs).slice(0, MAX_FEATURED),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [featuredSongs, tick]
  );

  const dynamicMadeForYou = useMemo(
    () => shuffle(madeForYouSongs).slice(0, MAX_MADE_FOR_YOU),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [madeForYouSongs, tick]
  );

  const dynamicTrending = useMemo(
    () => shuffle(trendingSongs).slice(0, MAX_TRENDING),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trendingSongs, tick]
  );

  // Height budget for (viewport - Topbar - bottom player)
  const HEIGHT_CLASS = "h-[calc(100vh-180px)]";

  // Hover color from FeaturedSection → pass rgb like "r,g,b"; pass null on leave
  const handleHoverColor = (rgb?: string | null) => {
    setHoveredColor(rgb ?? null);
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 3-column shell: Left | Center | Right */}
      <div className={`px-2 sm:px-4 pb-2`}>
        <div
          className={`grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-3 min-h-0 ${HEIGHT_CLASS}`}
        >
          {/* Left sidebar */}
          <aside className="hidden lg:block h-full min-h-0 overflow-hidden">
            <LeftSidebar />
          </aside>

          {/* Center content */}
          <section className="relative h-full min-h-0 overflow-hidden rounded-md">
            {/* Ultra-smooth dynamic glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 transition-[opacity,filter] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                filter: "blur(22px) saturate(105%)",
                background: `
                  radial-gradient(1200px 600px at 30% -12%, rgba(${displayColor},0.48), rgba(${displayColor},0.18) 60%, rgba(0,0,0,0) 78%),
                  radial-gradient(900px 420px at 90% 10%, rgba(${displayColor},0.22), rgba(0,0,0,0) 70%),
                  linear-gradient(to bottom, rgba(${displayColor},0.12), rgba(0,0,0,0) 55%)
                `,
                opacity: 0.9,
              }}
            />

            <ScrollArea className="relative z-10 h-full">
              <div className="p-4 sm:p-6">
                <div className="mx-auto w-full max-w-4xl">
                  <SignedIn>
                    {searchQuery && (
                      <>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Search Results</h1>
                        <SearchResults songs={filteredSongs} />
                      </>
                    )}
                  </SignedIn>

                  {!searchQuery && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold mb-6">{getGreeting()}</h1>

                      {/* Featured under greeting → reshuffled + square cards + hover color hook */}
                      <FeaturedSection songs={dynamicFeatured} onHoverColor={handleHoverColor} />

                      <div className="space-y-8 mt-6">
                        <SectionGrid
                          title="Made For You"
                          songs={dynamicMadeForYou}
                          isLoading={isLoading}
                        />
                        <SectionGrid
                          title="Trending"
                          songs={dynamicTrending}
                          isLoading={isLoading}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </ScrollArea>
          </section>

          {/* Right rail */}
          <aside className="hidden xl:block h-full min-h-0 overflow-hidden">
            <FriendsActivity />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
