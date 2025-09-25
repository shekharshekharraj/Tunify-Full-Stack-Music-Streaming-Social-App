import { usePlayerStore } from "@/stores/usePlayerStore";
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState, useCallback } from "react";
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
        setDominantColor,
        dominantColor,
        audioNodes,
    } = usePlayerStore();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // --- 1. Sync Time/Duration from Global Audio Element ---
    useEffect(() => {
        // ✅ Directly use the audio element from the Zustand store
        const audio = audioNodes.audioElement;

        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        
        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        
        // Initial sync
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
        };
    }, [audioNodes.audioElement]); // Dependency is on the element from the store


    // --- 2. Fullscreen API Integration (No changes) ---
    const requestFullScreenOnUserGesture = useCallback(() => {
        if (playerRef.current?.requestFullscreen) {
            playerRef.current.requestFullscreen();
        }
    }, []);

    const exitFullScreen = useCallback(() => {
        if (document.exitFullscreen) document.exitFullscreen();
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNativeFullScreen = !!document.fullscreenElement;
            if (isNativeFullScreen !== isFullScreen) {
                toggleFullScreen();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isFullScreen, toggleFullScreen]);

    useEffect(() => {
        if (!isFullScreen && document.fullscreenElement) {
            exitFullScreen();
        }
    }, [isFullScreen, exitFullScreen]);


    // --- 3. Dominant Color Extraction (No changes) ---
    useEffect(() => {
        if (currentSong?.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = currentSong.imageUrl;

            img.onload = () => {
                try {
                    const colorThief = new ColorThief();
                    const rgb = colorThief.getColor(img);
                    setDominantColor(`${rgb[0]},${rgb[1]},${rgb[2]}`);
                } catch (error) {
                    setDominantColor("20,20,20");
                }
            };
            img.onerror = () => {
                setDominantColor("20,20,20");
            };
        } else {
             setDominantColor("20,20,20");
        }
    }, [currentSong?.imageUrl, setDominantColor]);


    // --- 4. Audio Visualizer Drawing Loop ---
    useEffect(() => {
        const { analyser, audioContext } = audioNodes;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!analyser || !ctx || !canvas || !isFullScreen || !isPlaying || !audioContext || audioContext.state === 'closed') {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawVisualizer = () => {
            if (!audioNodes.analyser || !canvasRef.current || !audioNodes.audioContext || audioNodes.audioContext.state === 'closed') {
                 if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                return;
            }
            animationFrameRef.current = requestAnimationFrame(drawVisualizer);

            audioNodes.analyser.getByteFrequencyData(dataArray);
            const ctx = canvasRef.current.getContext("2d");
            if(!ctx) return;

            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            const barWidth = (canvasRef.current.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 255 * canvasRef.current.height * 0.8;
                const [r, g, b] = dominantColor.split(',').map(Number);
                const intensity = dataArray[i] / 255;
                ctx.fillStyle = `rgba(${r + intensity * 50}, ${g + intensity * 50}, ${b + intensity * 50}, 0.9)`;
                ctx.fillRect(x, canvasRef.current.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        drawVisualizer();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isFullScreen, isPlaying, dominantColor, audioNodes]);


    if (!isFullScreen || !currentSong) {
        return null;
    }

    const handleSeek = (value: number[]) => {
        // ✅ Directly use the audio element from the store to seek
        const audio = audioNodes.audioElement;
        if (audio) {
            audio.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    return (
        <div
            ref={playerRef} 
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center animate-in fade-in
               bg-black/70 backdrop-blur-2xl"
        >
            <div
                className='absolute inset-0 bg-cover bg-center -z-10 blur-2xl opacity-40' 
                style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
            />
            <div
                className='absolute inset-0 -z-10'
                style={{ 
                    background: `linear-gradient(to bottom, rgba(${dominantColor}, 0.2), rgba(0,0,0,0.8) 100%)` 
                }}
            />
            <button 
                onClick={() => { 
                    toggleFullScreen(); 
                    requestFullScreenOnUserGesture();
                }} 
                className='absolute top-5 right-5 text-white/70 hover:text-white transition-colors'>
                <ChevronDown size={32} />
            </button>
            <div className='flex flex-col items-center gap-6 text-white w-full max-w-md px-4 relative z-10'>
                <img
                    src={currentSong.imageUrl}
                    alt={currentSong.title}
                    className='w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-lg shadow-2xl'
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
                        className='w-full hover:cursor-grab active-cursor-grabbing custom-slider'
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
            <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-center pointer-events-none z-0">
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-full max-w-6xl"
                    width="1200"
                    height="160"
                ></canvas>
            </div>
        </div>
    );
};

export default FullScreenPlayer;