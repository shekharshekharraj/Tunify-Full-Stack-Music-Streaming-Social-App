import { useEffect, useMemo, useRef, useState } from "react";
import ColorThief from "colorthief";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { Song } from "@/types";
import PlayButton from "./PlayButton";

type Props = {
  songs: Song[];
  /** Optional: notify parent with "r,g,b" on hover; null/undefined on leave */
  onHoverColor?: (rgb?: string | null) => void;
};

const toRGB = (arr: number[]) =>
  `${Math.max(0, arr[0] | 0)},${Math.max(0, arr[1] | 0)},${Math.max(0, arr[2] | 0)}`;

// Typed spring presets
const layoutSpring = {
  type: "spring" as const,
  stiffness: 220,
  damping: 30,
  mass: 0.7,
};
const itemSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 26,
  mass: 0.7,
};

// Use cubicBezier helper instead of raw array
const exitEase = cubicBezier(0.22, 1, 0.36, 1);

const itemEnter = {
  opacity: 1,
  scale: 1,
  y: 0,
  filter: "blur(0px)",
  transition: itemSpring,
};

const itemExit = {
  opacity: 0,
  scale: 0.985,
  y: -6,
  filter: "blur(2px)",
  transition: { duration: 0.18, ease: exitEase },
};

const FeaturedSection = ({ songs, onHoverColor }: Props) => {
  const [colors, setColors] = useState<Record<string, string>>({});
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!songs?.length) return;
    let cancelled = false;
    const thief = new ColorThief();

    const run = async () => {
      const entries: [string, string][] = [];
      for (const s of songs) {
        if (!s.imageUrl) continue;
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.referrerPolicy = "no-referrer";
          img.src = s.imageUrl;
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error("image load failed"));
          });
          const rgb = thief.getColor(img);
          entries.push([s._id, toRGB(rgb)]);
          img.remove();
        } catch {
          entries.push([s._id, "120,120,120"]);
        }
      }
      if (!cancelled) {
        setColors((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [songs]);

  const cards = useMemo(() => songs ?? [], [songs]);

  return (
    <section className="mb-6">
      <motion.div
        layout
        transition={{ layout: layoutSpring }}
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        <AnimatePresence initial={false}>
          {cards.map((song, i) => {
            const rgb = colors[song._id];
            return (
              <motion.div
                key={song._id}
                layout
                initial={{ opacity: 0, scale: 0.99, y: 8, filter: "blur(3px)" }}
                animate={itemEnter}
                exit={itemExit}
                transition={{
                  layout: layoutSpring,
                  delay: Math.min(i * 0.015, 0.12),
                }}
                className="group relative rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
                onMouseEnter={() => onHoverColor?.(rgb)}
                onMouseLeave={() => onHoverColor?.(null)}
              >
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>

                <div className="p-3">
                  <div className="font-semibold truncate">{song.title}</div>
                  <div className="text-sm text-zinc-400 truncate">{song.artist}</div>
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <PlayButton song={song} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div ref={loaderRef} className="hidden" />
    </section>
  );
};

export default FeaturedSection;
