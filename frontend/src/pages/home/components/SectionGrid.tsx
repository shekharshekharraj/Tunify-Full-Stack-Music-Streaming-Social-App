import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { Song } from "@/types";
import PlayButton from "./PlayButton";

type Props = {
  title: string;
  songs: Song[];
  isLoading?: boolean;
};

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

const SectionGrid = ({ title, songs = [], isLoading }: Props) => {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold mb-3">{title}</h2>

      <motion.div
        layout
        transition={{ layout: layoutSpring }}
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        <AnimatePresence initial={false}>
          {!isLoading &&
            songs.map((song, i) => (
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
            ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default SectionGrid;
