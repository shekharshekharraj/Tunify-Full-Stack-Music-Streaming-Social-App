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
    <main className="bg-gradient-to-b from-zinc-900 to-black">
      <Topbar />

      {/* Shell: Left list | Center chat */}
      <div className="px-2 sm:px-4">
        <div
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3"
          style={{ height: H }}
        >
          {/* Left column: users list (independent scroll) */}
          <aside className="min-h-0 overflow-hidden rounded-lg bg-zinc-900">
            <ScrollArea className="h-full">
              <UsersList />
            </ScrollArea>
          </aside>

          {/* Center column: chat area */}
          <section className="min-h-0 overflow-hidden rounded-lg bg-zinc-900 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat header (fixed within center) */}
                <div className="px-4 py-3 border-b border-zinc-800">
                  <ChatHeader />
                </div>

                {/* Messages (scrollable) */}
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <ScrollArea className="flex-1 px-4 py-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const mine = message.sender === currentUserDb?._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex items-start gap-3 ${mine ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="size-8">
                              <AvatarImage
                                src={mine ? clerkUser?.imageUrl : selectedUser.imageUrl}
                              />
                            </Avatar>

                            <div
                              className={`rounded-lg p-3 max-w-[70%] ${
                                mine ? "bg-green-500" : "bg-zinc-800"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <span className="text-xs text-zinc-300 mt-1 block">
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

                {/* Composer anchored to bottom of the center column */}
                <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/90 backdrop-blur">
                  <MessageInput />
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
  <div className="flex flex-col items-center justify-center h-full space-y-6 rounded-lg bg-zinc-900">
    <img src="/Tunify.png" alt="Tunify" className="size-16 animate-bounce" />
    <div className="text-center">
      <h3 className="text-zinc-300 text-lg font-medium mb-1">No conversation selected</h3>
      <p className="text-zinc-500 text-sm">Choose a friend to start chatting</p>
    </div>
  </div>
);

export default ChatPage;
