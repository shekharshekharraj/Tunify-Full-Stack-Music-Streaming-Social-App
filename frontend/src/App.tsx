// src/App.tsx
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Suspense, lazy, useMemo } from "react";

import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/home/HomePage";
import FeedPage from "./pages/feed/FeedPage";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import NotFoundPage from "./pages/404/NotFoundPage";
import PartyFab from "@/components/party/PartyFab";
import ChatWidget from "@/components/ai/ChatWidget";
import ChatButton from "@/components/ai/ChatButton";
import { Toaster } from "react-hot-toast";

// Code-split heavier pages
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth-callback/AuthCallbackPage"));
// ✅ remove .tsx extension for better portability
const AiChatPage = lazy(() => import("./pages/ai/AiChatPage.tsx"));
const PartyRoom = lazy(() => import("./pages/party/PartyRoom"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));

// ✨ NEW: lazy-load the YouTube search panel page
const YouTubeSearchPanel = lazy(() => import("@/pages/yt/YouTubeSearchPanel"));

function App() {
  const location = useLocation();

  // Hide the floating AI overlay on /chat and /ai (and their sub-routes)
  const hideAiOverlay = useMemo(() => {
    const p = location.pathname;
    return p === "/chat" || p.startsWith("/chat/") || p === "/ai" || p.startsWith("/ai/");
  }, [location.pathname]);

  return (
    <>
      <Suspense
        fallback={
          <div className="fixed inset-0 grid place-items-center bg-zinc-900">
            <div className="text-white/80 text-sm">Loading…</div>
          </div>
        }
      >
        <Routes>
          {/* Auth / callbacks (outside layout) */}
          <Route
            path="/sso-callback"
            element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
          />
          <Route path="/auth-callback" element={<AuthCallbackPage />} />

          {/* Standalone pages (outside layout) */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/ai" element={<AiChatPage />} />

          {/* App shell */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/albums/:albumId" element={<AlbumPage />} />

            {/* Party routes */}
            <Route path="/party/:partyId" element={<PartyRoom />} />
            <Route path="/party/code/:codeOrId" element={<PartyRoom />} />

            {/* What's New */}
            <Route path="/whats-new" element={<WhatsNew />} />

            {/* ✨ NEW: public route to the YouTube Search page */}
            <Route path="/yt" element={<YouTubeSearchPanel />} />

            {/* 404 fallback inside layout */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>

      <Toaster />

      {!hideAiOverlay && (
        <>
          <ChatWidget />
          <ChatButton />
        </>
      )}

      <PartyFab />
    </>
  );
}

export default App;
