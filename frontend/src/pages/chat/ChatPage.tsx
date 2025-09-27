// src/pages/chat/ChatPage.tsx
import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import { Loader2 } from "lucide-react";

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const ChatPage = () => {
  const { messages, selectedUser, currentUserDb, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: clerkUser } = useUser();

  // height between Topbar and bottom player (set these CSS vars globally)
  const H = "calc(100vh - var(--topbar-h) - var(--player-h))";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="relative bg-zinc-900">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(900px 400px at 15% -10%, rgba(244,63,94,0.28), rgba(0,0,0,0) 70%),
            radial-gradient(700px 320px at 100% 0%, rgba(255,255,255,0.07), rgba(0,0,0,0) 70%),
            linear-gradient(to bottom, rgba(255,255,255,.04), rgba(0,0,0,0) 55%)
          `,
          filter: "blur(22px) saturate(105%)",
          opacity: 0.9,
        }}
      />

      <Topbar />

      {/* Shell: Left list | Center chat */}
      <div className="relative z-10 px-2 sm:px-4">
        <div
          className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3"
          style={{ height: H }}
        >
          {/* Left column: users list (glassy panel) */}
          <aside
            className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-md"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.06), 0 10px 26px -12px rgba(0,0,0,.55)",
            }}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-200">
                Messages
              </h3>
            </div>
            <ScrollArea className="h-[calc(100%-48px)]">
              <UsersList />
            </ScrollArea>
          </aside>

          {/* Center column: chat area */}
          <section
            className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-md flex flex-col"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.06), 0 10px 26px -12px rgba(0,0,0,.55)",
            }}
          >
            {selectedUser ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <ChatHeader />
                </div>

                {/* Messages */}
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading conversation…</span>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 px-3 sm:px-4 py-4">
                    <div className="mx-auto w-full max-w-3xl space-y-4">
                      {messages.map((message) => {
                        const mine = message.sender === currentUserDb?._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex items-end gap-3 ${mine ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="size-9 ring-1 ring-white/15">
                              <AvatarImage
                                src={mine ? clerkUser?.imageUrl : selectedUser.imageUrl}
                              />
                            </Avatar>

                            <div
                              className={`relative max-w-[74%] rounded-2xl px-3 py-2.5 shadow-sm ring-1 ${
                                mine
                                  ? "bg-emerald-500/95 text-black ring-emerald-300/60"
                                  : "bg-zinc-800/80 text-zinc-100 ring-white/10"
                              }`}
                            >
                              {/* Bubble tail */}
                              <span
                                className={`absolute bottom-0 ${
                                  mine ? "-right-1" : "-left-1"
                                } h-3 w-3 rotate-45 ${
                                  mine ? "bg-emerald-500/95 ring-1 ring-emerald-300/60" : "bg-zinc-800/80 ring-1 ring-white/10"
                                }`}
                                style={{ borderRadius: 2 }}
                              />
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <span
                                className={`mt-1 block text-[11px] ${
                                  mine ? "text-black/70" : "text-zinc-400"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                )}

                {/* Composer */}
                <div className="border-t border-white/10 px-3 sm:px-4 py-3 bg-white/[0.02]">
                  <div className="mx-auto w-full max-w-3xl">
                    <MessageInput />
                  </div>
                </div>
              </>
            ) : (
              <NoConversationPlaceholder />
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

const NoConversationPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-6 rounded-xl bg-transparent">
    <div className="grid place-items-center size-16 rounded-2xl bg-rose-500/15 ring-1 ring-white/10">
      <img src="/Tunify.png" alt="Tunify" className="size-8" />
    </div>
    <div className="text-center">
      <h3 className="text-zinc-200 text-lg font-semibold mb-1">No conversation selected</h3>
      <p className="text-zinc-400 text-sm">
        Choose a friend from the left to start chatting.
      </p>
    </div>
  </div>
);

export default ChatPage;
