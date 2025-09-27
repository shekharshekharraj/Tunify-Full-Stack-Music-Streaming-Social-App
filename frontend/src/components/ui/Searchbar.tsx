// src/components/ui/Searchbar.tsx
import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  placeholder?: string;
};

const Searchbar = ({ searchQuery, setSearchQuery, placeholder = "Search songs, artists…" }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: press "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!isTyping && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const clear = () => setSearchQuery("");

  return (
    <div className="relative group">
      {/* Animated gradient frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-75 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(244,63,94,.6), rgba(59,130,246,.6), rgba(16,185,129,.6), rgba(244,63,94,.6))",
          filter: "blur(6px)",
          maskImage:
            "radial-gradient(closest-side, rgba(0,0,0,0.9), rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      />

      <div className="relative flex items-center gap-2 rounded-xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 focus-within:ring-rose-500/60 transition-shadow duration-300 shadow-[0_4px_28px_rgba(0,0,0,.35)]">
        {/* Icon */}
        <div className="pl-3 sm:pl-3.5 text-zinc-400">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent outline-none border-0 py-2.5 sm:py-3 pr-12 text-sm sm:text-base placeholder:text-zinc-500 text-white"
          placeholder={placeholder}
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button + shortcut hint */}
        <div className="absolute right-2.5 flex items-center gap-2">
          {searchQuery && (
            <button
              onClick={clear}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear search"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-1 text-[10px] font-medium text-zinc-300 ring-1 ring-white/10"
            title="Press / to focus"
          >
            /
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default Searchbar;
