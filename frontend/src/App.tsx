// frontend/src/App.tsx
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
import AiChatPage from "@/pages/ai/AiChatPage.tsx";
import PartyPage from "@/pages/party/PartyPage";

import { Toaster } from "react-hot-toast";

// Global AI Companion overlay
import ChatWidget from "@/components/ai/ChatWidget";
import ChatButton from "@/components/ai/ChatButton";
import PartyFab from "@/components/party/PartyFab";

function App() {
  const location = useLocation();

  // Hide floating AI overlay on full-page chat UIs
  const hideAiOverlay = location.pathname === "/chat" || location.pathname === "/ai";

  return (
    <>
      <Routes>
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
        />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/ai" element={<AiChatPage />} />

        {/* App shell */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
          <Route path="/party/:partyId" element={<PartyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Global toasts */}
      <Toaster />

      {/* Global AI overlay (Dialog + FAB) */}
      {!hideAiOverlay && (
        <>
          <ChatWidget />
          <ChatButton />
        </>
      )}

      {/* Always-visible Party FAB (auto-hides on /party/* inside the component) */}
      <PartyFab />
    </>
  );
}

export default App;
