// frontend/src/components/party/PartyFab.tsx
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Video, Users } from "lucide-react";

function genPartyId() {
  return Math.random().toString(36).slice(2, 8);
}

export default function PartyFab() {
  const nav = useNavigate();
  const loc = useLocation();
  const hidden = useMemo(
    () => loc.pathname.startsWith("/party"),
    [loc.pathname]
  );

  if (hidden) return null;

  return (
    <button
      onClick={() => nav(`/party/${genPartyId()}`)}
      className="
        fixed left-6 bottom-24 z-[60]
        inline-flex items-center gap-2
        rounded-full px-4 py-3
        bg-emerald-500/90 hover:bg-emerald-500
        text-white font-medium
        shadow-[0_12px_40px_rgba(16,185,129,0.35)]
        ring-1 ring-emerald-300/50
        backdrop-blur
        transition
      "
      aria-label="Start a watch party"
    >
      <Video className="h-5 w-5" />
      <span className="hidden sm:inline">Start Party</span>
      <Users className="h-4 w-4 opacity-90 sm:ml-0.5" />
    </button>
  );
}
