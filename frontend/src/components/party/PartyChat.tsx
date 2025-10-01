import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";

type Role = "leader" | "follower";

type ChatMsg = {
  partyId: string;
  text: string;
  ts: number;
  from: string;   // socket.id of sender
  role?: Role;    // carried with message
};

export default function PartyChat({
  socket,
  partyId,
  role,
}: {
  socket: Socket;
  partyId: string;
  role: Role;
}) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onChat = (m: ChatMsg) => {
      setMsgs((prev) => [...prev, m]);
      // scroll to bottom
      queueMicrotask(() => {
        const el = listRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    };

    socket.on("party:chat", onChat);

    // ✅ cleanup must return void, not the Socket
    return () => {
      socket.off("party:chat", onChat);
    };
  }, [socket]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    // ✅ socket.id can be undefined until connected; coerce to a string
    const sid: string = socket.id ?? "unknown";

    const msg: ChatMsg = {
      partyId,
      text,
      ts: Date.now(),
      from: sid,
      role, // include our role on send
    };

    socket.emit("party:chat", msg);
    setInput("");
  };

  // derive a label for messages that might not have role (back-compat)
  const labelFor = (m: ChatMsg): string => {
    if (m.role) return m.role;        // use what sender provided
    if (m.from === (socket.id ?? "")) return role; // fallback guess
    return role === "leader" ? "follower" : "leader";
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        className="min-h-[180px] max-h-[260px] overflow-y-auto rounded-lg border border-zinc-800/60 bg-black/30 p-3"
      >
        {msgs.map((m, i) => (
          <div key={i} className="text-sm mb-2">
            <span className="text-zinc-400 mr-1">{labelFor(m)}:</span>
            <span className="text-white">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md bg-black/40 border border-zinc-800/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} className="bg-emerald-600 hover:bg-emerald-500">
          Send
        </Button>
      </div>
    </div>
  );
}
