import { usePlayerStore } from "@/stores/usePlayerStore";
import { X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Type definition for a parsed lyric line
type LyricLine = {
	time: number;
	text: string;
};

// Parser function to convert LRC string to an array of LyricLine objects
const parseLRC = (lrcText: string): LyricLine[] => {
	if (!lrcText) return [];
	const lines = lrcText.split("\n");
	const parsedLines: LyricLine[] = [];

	lines.forEach((line) => {
		const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
		if (match) {
			const minutes = parseInt(match[1], 10);
			const seconds = parseInt(match[2], 10);
			const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
			const time = minutes * 60 + seconds + milliseconds / 1000;
			const text = match[4].trim();
			if (text) {
				parsedLines.push({ time, text });
			}
		}
	});

	return parsedLines.sort((a, b) => a.time - b.time);
};

const LyricsView = () => {
	const { currentSong, showLyrics, toggleLyrics, currentTime } = usePlayerStore();
	const [currentLineIndex, setCurrentLineIndex] = useState(-1);
	const activeLineRef = useRef<HTMLParagraphElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const lyrics = useMemo(() => {
		return currentSong?.lyrics ? parseLRC(currentSong.lyrics) : [];
	}, [currentSong]);

	useEffect(() => {
		if (lyrics.length > 0) {
			let newIndex = lyrics.findIndex((line, index) => {
				const nextLine = lyrics[index + 1];
				return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
			});
			if (newIndex === -1 && currentTime > 0 && lyrics.length > 0) {
				newIndex = lyrics.length -1;
			}
			setCurrentLineIndex(newIndex);
		} else {
			setCurrentLineIndex(-1);
		}
	}, [currentTime, lyrics]);

	useEffect(() => {
		activeLineRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}, [currentLineIndex]);

	if (!showLyrics || !currentSong) {
		return null;
	}

	return (
		<div className='fixed top-0 right-0 bottom-24 w-full sm:w-96 bg-zinc-900/95 backdrop-blur-md z-40 p-6 flex flex-col animate-in slide-in-from-right'>
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-lg font-bold'>Lyrics</h2>
				<button onClick={toggleLyrics} className='text-zinc-400 hover:text-white'>
					<X size={24} />
				</button>
			</div>
			<div className='flex items-center gap-4 mb-6'>
				<img src={currentSong.imageUrl} alt={currentSong.title} className='w-16 h-16 rounded-md' />
				<div>
					<p className='font-semibold'>{currentSong.title}</p>
					<p className='text-sm text-zinc-400'>{currentSong.artist}</p>
				</div>
			</div>
			<ScrollArea className='flex-1' ref={scrollAreaRef}>
				<div className='flex flex-col gap-4'>
					{lyrics.length > 0 ? (
						lyrics.map((line, index) => (
							<p
								key={index}
								ref={index === currentLineIndex ? activeLineRef : null}
								className={cn(
									"text-2xl font-semibold transition-colors duration-300",
									index === currentLineIndex ? "text-white" : "text-zinc-500"
								)}
							>
								{line.text}
							</p>
						))
					) : (
						<p className='text-zinc-500 text-center mt-8'>No lyrics available for this song.</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default LyricsView;