// src/pages/WhatsNew.tsx
import { useMemo, useState } from "react";
import { Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
// If you want to wire to your player store, import it and use it in onPlay
// import { usePlayerStore } from "@/stores/usePlayerStore";

type ReleaseType = "single" | "album" | "podcast";

type NewRelease = {
  id: string;
  type: ReleaseType;
  title: string;
  artists: string;
  coverUrl: string;
  releasedAgo: string; // e.g., "2 weeks ago"
  // Optional fields to hook into your player:
  audioUrl?: string;
};

const DEMO_MUSIC: NewRelease[] = [
  {
    id: "1",
    type: "single",
    title: "Maiya Teri Jai Jaikaar Remix",
    artists: "Arijit Singh, VDJ Fly, Dj Aadesh Sitamarhi",
    coverUrl:
      "/public/size_m.jpg",
    releasedAgo: "2 weeks ago",
  },
  {
    id: "2",
    type: "single",
    title: "Hunkara",
    artists: "Pritam, Amitabh Bhattacharya, Dev Negi",
    coverUrl:
      "/public/Hunkara.jpg",
    releasedAgo: "2 weeks ago",
  },
];

const DEMO_PODCASTS: NewRelease[] = [
  {
    id: "p1",
    type: "podcast",
    title: "Daily Tech Roundup — 15 min",
    artists: "TechWave",
    coverUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80&auto=format&fit=crop",
    releasedAgo: "3 days ago",
  },
  {
    id: "p2",
    type: "podcast",
    title: "Design Stories — Color & Emotion",
    artists: "StudioTalk",
    coverUrl:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&q=80&auto=format&fit=crop",
    releasedAgo: "1 week ago",
  },
];

export default function WhatsNew() {
  // const { initializeQueue, playNow } = usePlayerStore(); // if you want play wiring
  const [tab, setTab] = useState<"music" | "podcasts">("music");

  const releases = useMemo<NewRelease[]>(() => {
    return tab === "music" ? DEMO_MUSIC : DEMO_PODCASTS;
  }, [tab]);

  const onPlay = (item: NewRelease) => {
    // TODO: map your release to a Song object and wire it to the player store
    // Example:
    // const song = { title: item.title, artist: item.artists, imageUrl: item.coverUrl, audioUrl: item.audioUrl ?? "" };
    // initializeQueue([song]);
    // playNow(song);
    // For now, just no-op:
    console.log("Play:", item.title);
  };

  return (
    <main className="min-h-[calc(100vh-120px)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            What’s New
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            The latest releases from artists, podcasts, and shows you follow.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            className={cn(
              "px-4 py-2 rounded-full text-sm ring-1 transition",
              tab === "music"
                ? "bg-white text-black ring-transparent"
                : "bg-zinc-800 text-zinc-200 ring-zinc-700 hover:bg-zinc-700"
            )}
            onClick={() => setTab("music")}
          >
            Music
          </button>
          <button
            className={cn(
              "px-4 py-2 rounded-full text-sm ring-1 transition",
              tab === "podcasts"
                ? "bg-white text-black ring-transparent"
                : "bg-zinc-800 text-zinc-200 ring-zinc-700 hover:bg-zinc-700"
            )}
            onClick={() => setTab("podcasts")}
          >
            Podcast &amp; Shows
          </button>
        </div>

        {/* Section heading */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Earlier</h2>

        {/* List */}
        <div className="space-y-6">
          {releases.map((item) => (
            <article
              key={item.id}
              className="relative rounded-xl bg-zinc-900/50 ring-1 ring-zinc-800 overflow-hidden"
            >
              {/* thin divider at top (subtle) */}
              <div className="h-px bg-zinc-800/80" />

              <div className="flex items-center gap-5 px-4 sm:px-6 py-4">
                {/* Cover */}
                <div className="relative shrink-0">
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="h-24 w-24 rounded-lg object-cover shadow"
                    draggable={false}
                  />
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400 truncate">
                    {item.artists}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {item.type === "album"
                      ? "Album"
                      : item.type === "single"
                      ? "Single"
                      : "Podcast"}{" "}
                    • {item.releasedAgo}
                  </p>
                </div>

                {/* Add button (subtle) */}
                <button
                  title="Add to library"
                  className="mr-2 hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Play button */}
                <button
                  onClick={() => onPlay(item)}
                  title="Play"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:scale-[1.03] transition shadow"
                >
                  <Play className="h-5 w-5 translate-x-[1px]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
