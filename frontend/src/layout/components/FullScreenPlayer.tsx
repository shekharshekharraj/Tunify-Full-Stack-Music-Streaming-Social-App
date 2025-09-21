import { usePlayerStore } from "@/stores/usePlayerStore";
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState } from "react";
import ColorThief from "colorthief";

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const FullScreenPlayer = () => {
	const {
		currentSong,
		isFullScreen,
		toggleFullScreen,
		isPlaying,
		togglePlay,
		playNext,
		playPrevious,
		// dominantColor, // No longer strictly needed for this background style
		setDominantColor, // Still useful if you want to use the color elsewhere
	} = usePlayerStore();

	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		audioRef.current = document.querySelector("audio");
		const audio = audioRef.current;
		if (!audio || !isFullScreen) return;
		const updateTime = () => setCurrentTime(audio.currentTime);
		const updateDuration = () => setDuration(audio.duration);
		updateTime();
		updateDuration();
		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);
		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
		};
	}, [isFullScreen, currentSong]);

	useEffect(() => {
		if (currentSong?.imageUrl) {
			const img = new Image();
			img.crossOrigin = "Anonymous";
			img.src = currentSong.imageUrl;

			img.onload = () => {
				const colorThief = new ColorThief();
				try {
					const rgb = colorThief.getColor(img);
					setDominantColor(`${rgb[0]},${rgb[1]},${rgb[2]}`);
				} catch (error) {
					console.error("Failed to extract color:", error);
					setDominantColor("20,20,20"); // Fallback
				}
			};
			img.onerror = () => {
				setDominantColor("20,20,20"); // Fallback
			};
		}
	}, [currentSong?.imageUrl, setDominantColor]);

	if (!isFullScreen || !currentSong) {
		return null;
	}

	const handleSeek = (value: number[]) => {
		if (audioRef.current) {
			audioRef.current.currentTime = value[0];
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex flex-col items-center justify-center animate-in fade-in'
			// --- THE CHANGE IS HERE ---
			// Removed the direct background color from the main container.
			// Instead, we rely on a separate blurred background image.
			// The `backdrop-blur-lg` class will still apply a blur effect
			// to anything behind this container, making elements distinct.
		>
			{/* Blurred album art background layer */}
			<div
				className='absolute inset-0 bg-cover bg-center -z-10 blur-2xl opacity-40' // Increased opacity for more visibility
				style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
			/>

			{/* Translucent overlay using the dominant color */}
			<div
				className='absolute inset-0 -z-10'
				style={{ background: `linear-gradient(to bottom, rgba(${usePlayerStore.getState().dominantColor}, 0.2), rgba(${usePlayerStore.getState().dominantColor}, 0.0) 50%, rgba(0,0,0,0.6) 100%)` }}
			/>


			<button onClick={toggleFullScreen} className='absolute top-5 right-5 text-white/70 hover:text-white transition-colors'>
				<ChevronDown size={32} />
			</button>
			<div className='flex flex-col items-center gap-6 text-white w-full max-w-md px-4'>
				<img
					src={currentSong.imageUrl}
					alt={currentSong.title}
					className='w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-lg shadow-2xl' // Added shadow for depth
				/>
				<div className='text-center'>
					<h2 className='text-3xl font-bold'>{currentSong.title}</h2>
					<p className='text-lg text-white/80'>{currentSong.artist}</p>
				</div>
				<div className='w-full space-y-2'>
					<Slider
						value={[currentTime]}
						max={duration || 100}
						step={1}
						className='w-full hover:cursor-grab active:cursor-grabbing custom-slider'
						onValueChange={handleSeek}
					/>
					<div className='flex justify-between text-xs text-white/80'>
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>
				<div className='flex items-center justify-center gap-6'>
					<Button size='icon' variant='ghost' className='hover:text-white text-zinc-300' onClick={playPrevious}>
						<SkipBack className='h-6 w-6' />
					</Button>
					<Button size='icon' className='bg-white hover:bg-white/90 text-black rounded-full h-16 w-16' onClick={togglePlay}>
						{isPlaying ? <Pause className='h-8 w-8' /> : <Play className='h-8 w-8 fill-current' />}
					</Button>
					<Button size='icon' variant='ghost' className='hover:text-white text-zinc-300' onClick={playNext}>
						<SkipForward className='h-6 w-6' />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FullScreenPlayer;