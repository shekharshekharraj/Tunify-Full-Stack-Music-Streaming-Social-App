// src/layout/MainLayout.tsx
import { Outlet } from "react-router-dom";
import MainLayoutWrapper from "./MainLayoutWrapper";
import MainLayoutPlayer from "./components/MainLayoutPlayer";
import LyricsView from "@/components/LyricsView";
// If you want a single global Topbar, import it and remove Topbar from pages.
// import Topbar from "@/components/Topbar";

const PLAYER_H = 96; // height of the bottom player in pixels

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <MainLayoutWrapper />

      {/* If you want a single global Topbar, uncomment next line and remove Topbar from pages */}
      {/* <Topbar /> */}

      {/* Page area with extra bottom padding so the fixed player doesn't cover content */}
      <div
        className="min-h-[calc(100vh-96px)]"
        style={{ paddingBottom: `${PLAYER_H}px` }}
      >
        <Outlet />
      </div>

      {/* Lyrics overlay rendered OUTSIDE the player so it can layer above other UI */}
      <LyricsView />

      {/* Player is fixed at bottom; keep a lower z-index than LyricsView */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <MainLayoutPlayer />
      </div>
    </div>
  );
};

export default MainLayout;
