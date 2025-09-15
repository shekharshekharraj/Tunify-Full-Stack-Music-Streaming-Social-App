import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useMemo, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import SearchResults from "./components/SearchResults";

const HomePage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const {
		fetchFeaturedSongs,
		fetchMadeForYouSongs,
		fetchTrendingSongs,
		isLoading,
		madeForYouSongs,
		featuredSongs,
		trendingSongs,
	} = useMusicStore();

	const { initializeQueue } = usePlayerStore();

	useEffect(() => {
		fetchFeaturedSongs();
		fetchMadeForYouSongs();
		fetchTrendingSongs();
	}, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

	const allSongs = useMemo(() => {
		// Combine all songs and remove duplicates
		const songMap = new Map<string, Song>();
		[...featuredSongs, ...madeForYouSongs, ...trendingSongs].forEach((song) => {
			if (!songMap.has(song._id)) {
				songMap.set(song._id, song);
			}
		});
		return Array.from(songMap.values());
	}, [featuredSongs, madeForYouSongs, trendingSongs]);

	useEffect(() => {
		if (allSongs.length > 0) {
			initializeQueue(allSongs);
		}
	}, [initializeQueue, allSongs]);

	const filteredSongs = useMemo(() => {
		if (!searchQuery) return [];
		return allSongs.filter(
			(song) =>
				song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				song.artist.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [searchQuery, allSongs]);

	// Function to get the dynamic greeting
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	};

	return (
		<main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>
			<Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
			<ScrollArea className='h-[calc(100vh-180px)]'>
				<div className='p-4 sm:p-6'>
					{searchQuery ? (
						<>
							<h1 className='text-2xl sm:text-3xl font-bold mb-6'>Search Results</h1>
							<SearchResults songs={filteredSongs} />
						</>
					) : (
						<>
							{/* Use the dynamic greeting here */}
							<h1 className='text-2xl sm:text-3xl font-bold mb-6'>{getGreeting()}</h1>
							<FeaturedSection />
							<div className='space-y-8'>
								<SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />
								<SectionGrid title='Trending' songs={trendingSongs} isLoading={isLoading} />
							</div>
						</>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};
export default HomePage;