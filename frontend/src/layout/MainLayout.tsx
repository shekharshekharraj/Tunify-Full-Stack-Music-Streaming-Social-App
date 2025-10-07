import { Outlet } from "react-router-dom";
import MainLayoutWrapper from "./MainLayoutWrapper";
import MainLayoutPlayer from "./components/MainLayoutPlayer";
import LyricsView from "@/components/LyricsView";
// import Topbar from "@/components/Topbar";

// UPDATED: mount the right-side YouTube dock globally
import RightDockYouTube from "@/components/yt/RightDockYouTube"; // UPDATED

const PLAYER_H = 96;

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <MainLayoutWrapper />
      {/* <Topbar /> */}

      <div className="min-h-[calc(100vh-96px)]" style={{ paddingBottom: `${PLAYER_H}px` }}>
        <Outlet />
      </div>

      <LyricsView />

      {/* UPDATED: render the dock so it's available on Home (self-hides elsewhere) */}
      <RightDockYouTube /> {/* UPDATED */}

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <MainLayoutPlayer />
      </div>
    </div>
  );
};

export default MainLayout;
