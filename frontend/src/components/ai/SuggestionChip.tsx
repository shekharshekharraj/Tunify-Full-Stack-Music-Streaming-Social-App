import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function SuggestionChip({
  label,
  onClick,
  icon,
  className,
}: { label: string; onClick: () => void; icon?: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30",
        "bg-zinc-900/60 text-zinc-200 px-3 py-1.5 text-xs",
        "hover:border-emerald-400/60 hover:text-white hover:bg-zinc-800/60",
        "transition-colors"
      , className)}
    >
      {icon ? <span className="opacity-90">{icon}</span> : null}
      {label}
    </button>
  );
}
