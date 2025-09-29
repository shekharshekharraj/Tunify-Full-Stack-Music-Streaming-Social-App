// frontend/src/App.tsx
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";
import FeedPage from "./pages/feed/FeedPage";
import { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/404/NotFoundPage";
import AiChatPage from "@/pages/ai/AiChatPage.tsx";

// ✨ AI Companion (global overlay components)
import ChatWidget from "../src/components/ai/ChatWidget";
import ChatButton from "../src/components/ai/ChatButton";

<Route path="/ai" element={<AiChatPage />} />

function App() {
  const location = useLocation();
  // Hide the floating FAB on the dedicated /chat page to avoid UX overlap.
  const showAiChatOverlay = location.pathname !== "/chat";

  return (
    <>
      <Routes>
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
        />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Global toasters */}
      <Toaster />

      {/* Global AI Music Companion overlay (dialog + FAB) */}
      {showAiChatOverlay && (
        <>
          <ChatWidget />
          <ChatButton />
        </>
      )}
    </>
  );
}

export default App;
