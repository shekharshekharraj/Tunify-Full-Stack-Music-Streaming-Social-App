// src/pages/home/HomePage.tsx
import Topbar from "@/components/Topbar";
import LeftSidebar from "@/layout/components/LeftSidebar";
import FriendsActivity from "@/layout/components/FriendsActivity";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useMemo, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import SearchResults from "./components/SearchResults";
import { SignedIn, useUser } from "@clerk/clerk-react";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    songs,
    fetchSongs,
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    isLoading,
    madeForYouSongs,
    trendingSongs,
  } = useMusicStore();

  const { initializeQueue } = usePlayerStore();
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
    if (isSignedIn) fetchSongs();
  }, [isSignedIn, fetchSongs, fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  useEffect(() => {
    if (songs.length > 0) initializeQueue(songs);
  }, [initializeQueue, songs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [searchQuery, songs]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Height budget for (viewport - Topbar - bottom player).
  // Adjust 180px if you change those components’ heights.
  const HEIGHT_CLASS = "h-[calc(100vh-180px)]";

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 3-column shell: Left | Center | Right */}
      <div className={`px-2 sm:px-4 pb-2`}>
        <div
          className={`grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-3 min-h-0 ${HEIGHT_CLASS}`}
        >
          {/* Left sidebar (independent scroll) */}
          <aside className="hidden lg:block h-full min-h-0 overflow-hidden">
            <LeftSidebar />
          </aside>

          {/* Center content (independent scroll) */}
          <section className="h-full min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6">
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
                    <FeaturedSection />
                    <div className="space-y-8">
                      <SectionGrid
                        title="Made For You"
                        songs={madeForYouSongs}
                        isLoading={isLoading}
                      />
                      <SectionGrid title="Trending" songs={trendingSongs} isLoading={isLoading} />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </section>

          {/* Right rail (optional) */}
          <aside className="hidden xl:block h-full min-h-0 overflow-hidden">
            <FriendsActivity />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
