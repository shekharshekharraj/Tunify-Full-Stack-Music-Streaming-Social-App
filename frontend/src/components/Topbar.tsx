// frontend/src/components/Topbar.tsx
import React, { useEffect, useState } from "react";
import { SignedOut, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { LayoutDashboardIcon, Video, Bell, Rocket, Wand2, Youtube } from "lucide-react"; // ⬅️ NEW: Youtube
import { Link, useLocation, useNavigate } from "react-router-dom";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import Searchbar from "./ui/Searchbar";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { axiosInstance } from "@/lib/axios";

export type TopbarProps = {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
};

function genPartyId() {
  return Math.random().toString(36).slice(2, 8);
}

const Topbar: React.FC<TopbarProps> = ({ searchQuery, setSearchQuery }) => {
  const { isFullScreen } = usePlayerStore();

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const navigate = useNavigate();

  const { isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin probe (kept as-is)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSignedIn || !authLoaded) {
        if (mounted) setIsAdmin(false);
        return;
      }
      try {
        const token = await getToken();
        const headers: Record<string, string> = { "Cache-Control": "no-cache" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const ts = Date.now();
        const { data } = await axiosInstance.get(`/admin/is-admin?_=${ts}`, {
          headers,
          withCredentials: true,
        });
        if (mounted) setIsAdmin(!!data?.isAdmin);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, authLoaded, getToken, user?.id]);

  if (isFullScreen) return null;

  const startParty = () => navigate(`/party/${genPartyId()}`);

  // Display-only ticker items
  const announcements = [
    { id: 1, text: "Try Pro free for 7 days", icon: <Rocket className="size-3.5 inline -mt-0.5" /> },
    { id: 2, text: "New: AI mood mixes & playlist generator", icon: <Wand2 className="size-3.5 inline -mt-0.5" /> },
    { id: 3, text: "PartyRoom sync smoother than ever", icon: <Video className="size-3.5 inline -mt-0.5" /> },
    { id: 4, text: "What’s New: June release notes", icon: <Bell className="size-3.5 inline -mt-0.5" /> },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="relative w-full">
        {/* ───── Main black bar (thin & sleek) ───── */}
        <div
          className={cn(
            "w-full",
            "bg-black/70 backdrop-blur-sm",
            "shadow-[inset_0_1px_0_rgba(255,255,255,.035)]"
          )}
        >
          {/* Hairlines */}
          <div className="relative">
            <div className="absolute inset-x-0 -top-px h-px bg-white/10" />
            <div className="absolute inset-x-0 -bottom-px h-px bg-black/60" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 py-2.5">
              {/* Left: Logo (compact) */}
              <Link
                to="/"
                className="group flex items-center gap-2 min-w-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                aria-label="Go to Home"
              >
                <img
                  src="/Tunify.png"
                  alt="Tunify logo"
                  className="size-7 sm:size-8 rounded-[8px] ring-1 ring-white/10 shadow-[0_4px_12px_rgba(0,0,0,.35)]"
                  draggable={false}
                />
                <span className="hidden sm:inline font-semibold text-[0.95rem] tracking-tight">
                  Tunify
                </span>
              </Link>

              {/* Center: Search (only on home + signed-in) */}
              <div className="justify-self-stretch">
                {isHomePage && isSignedIn && searchQuery !== undefined && setSearchQuery && (
                  <div className="mx-auto w-full max-w-[640px]">
                    <Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                  </div>
                )}
              </div>

              {/* Right: Actions (tight spacing) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* What's New */}
                <Link
                  to="/whats-new"
                  aria-label="What’s new"
                  className={cn(
                    "relative inline-flex h-8 w-8 items-center justify-center rounded-lg",
                    "ring-1 ring-white/10 bg-white/5 hover:bg-white/10",
                    "transition"
                  )}
                  title="What’s new"
                >
                  <Bell className="size-3.5 text-white/90" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                </Link>

                {/* ⬅️ NEW: Quick YouTube entry */}
                <Link
                  to="/yt"
                  aria-label="YouTube"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                    "ring-1 ring-white/10 bg-white/5 hover:bg-white/10",
                    "transition"
                  )}
                  title="YouTube"
                >
                  <Youtube className="size-3.5 text-white/90" />
                </Link>
                {/* ⬆️ NEW */}

                {/* Start Party */}
                <button
                  onClick={startParty}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg",
                    "bg-white/10 hover:bg-white/15 text-white",
                    "ring-1 ring-white/10 transition"
                  )}
                  aria-label="Start a watch party"
                >
                  <Video className="size-3.5" />
                  <span className="hidden xs:inline text-[13px] font-medium">Party</span>
                </button>

                {/* Admin (if any) */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-8 px-3 rounded-lg text-[13px]",
                      "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                    )}
                  >
                    <LayoutDashboardIcon className="size-3.5 mr-1.5" />
                    <span className="hidden xs:inline">Admin</span>
                  </Link>
                )}

                {/* Auth */}
                <SignedOut>
                  <div className="scale-95 origin-right">
                    <SignInOAuthButtons />
                  </div>
                </SignedOut>

                {/* User avatar */}
                <div className="ml-0.5">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonBox: "rounded-lg ring-1 ring-white/10",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Non-clickable ticker (purely display) ───── */}
        <div className="relative w-full bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/70" />

          <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
            <div
              className="relative overflow-hidden py-1.5"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                maskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              }}
              aria-label="Announcements"
            >
              <div className="flex items-center gap-6 whitespace-nowrap will-change-transform animate-[tunifyMarquee_18s_linear_infinite]">
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex items-center gap-6">
                    {announcements.map((a) => (
                      <span
                        key={`${dup}-${a.id}`}
                        className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full ring-1 ring-white/10 bg-white/[0.06] text-white/90"
                        style={{ cursor: "default" }}
                      >
                        {a.icon}
                        <span>{a.text}</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none h-1 w-full bg-gradient-to-b from-black/30 to-transparent" />
        </div>
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes tunifyMarquee {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </header>
  );
};

export default Topbar;
