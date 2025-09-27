// src/components/Topbar.tsx
import React, { useEffect, useState } from "react";
import { SignedOut, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

const Topbar: React.FC<TopbarProps> = ({ searchQuery, setSearchQuery }) => {
  // Hide while fullscreen player is open
  const { isFullScreen } = usePlayerStore();

  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const { isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Probe backend for admin (uses backend ADMIN_EMAIL / ADMIN_CLERK_ID)
  useEffect(() => {
    let mounted = true;

    (async () => {
      // need an authenticated user & auth api ready
      if (!isSignedIn || !authLoaded) {
        if (mounted) setIsAdmin(false);
        return;
      }

      try {
        // get a fresh Clerk JWT for THIS call
        const token = await getToken();
        const headers: Record<string, string> = { "Cache-Control": "no-cache" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const ts = Date.now(); // cache-buster
        const { data } = await axiosInstance.get(`/admin/is-admin?_=${ts}`, {
          headers,
          withCredentials: true,
        });

        if (mounted) setIsAdmin(!!data?.isAdmin);
      } catch (_err) {
        if (mounted) setIsAdmin(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, authLoaded, getToken, user?.id]);

  if (isFullScreen) return null;

  return (
    <header className="sticky top-0 z-50 bg-zinc-900/75 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 py-3">
          {/* Brand → click to go Home */}
          <Link
            to="/"
            className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
            aria-label="Go to Home"
          >
            <img src="/Tunify.png" alt="Tunify logo" className="size-8" />
            <span className="hidden sm:inline font-bold text-lg whitespace-nowrap">Tunify</span>
          </Link>

          {/* Center search (Home only, signed-in) */}
          <div className="justify-self-stretch">
            {isHomePage && isSignedIn && searchQuery !== undefined && setSearchQuery && (
              <div className="mx-auto w-full max-w-2xl">
                <Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(buttonVariants({ variant: "outline" }), "h-9 sm:h-10 px-3 sm:px-4")}
              >
                <LayoutDashboardIcon className="size-4 mr-2" />
                <span className="hidden xs:inline">Admin Dashboard</span>
              </Link>
            )}

            <SignedOut>
              <SignInOAuthButtons />
            </SignedOut>

            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
