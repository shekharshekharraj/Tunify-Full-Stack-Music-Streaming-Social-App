// src/App.tsx
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/home/HomePage";
import FeedPage from "./pages/feed/FeedPage";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import NotFoundPage from "./pages/404/NotFoundPage";
import AiChatPage from "@/pages/ai/AiChatPage.tsx"; // no .tsx in import
import PartyRoom from "@/pages/party/PartyRoom";
import WhatsNew from "@/pages/WhatsNew";

import { Toaster } from "react-hot-toast";
import ChatWidget from "@/components/ai/ChatWidget";
import ChatButton from "@/components/ai/ChatButton";
import PartyFab from "@/components/party/PartyFab";

function App() {
  const location = useLocation();
  const hideAiOverlay = location.pathname === "/chat" || location.pathname === "/ai";

  return (
    <>
      <Routes>
        {/* Auth / callbacks (outside layout) */}
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />
          }
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

          {/* 404 fallback inside layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

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
