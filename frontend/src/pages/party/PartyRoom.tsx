import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import EmojiLayer from "@/components/party/EmojiLayer";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePartySync } from "@/hooks/usePartySync";
import { usePartyVideo } from "@/hooks/usePartyVideo";

export default function PartyRoom() {
  const { codeOrId } = useParams(); // route like /party/:codeOrId
  const partyId = codeOrId as string; // simple: treat code as room id; you can resolve code->id with API if you prefer
  const { audioNodes } = usePlayerStore() as any;

  const [role, setRole] = useState<"leader" | "follower">("leader");
  const [socket, setSocket] = useState<Socket | null>(null);
  const bus = useMemo(() => new EventTarget(), []);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const s = io("/party", { withCredentials: true });
    setSocket(s);
    s.emit("party:join", { partyId, user: { id: "me" } });

    s.on("party:emoji", ({ emoji }) => {
      bus.dispatchEvent(new CustomEvent("emoji", { detail: emoji }));
    });

    return () => {
      s.emit("party:leave", { partyId, user: { id: "me" } });
      s.disconnect();
    };
  }, [partyId, bus]);

  usePartySync(partyId, role, () => audioNodes?.audioElement ?? document.getElementById("global-audio") as HTMLAudioElement | null);
  useEffect(() => {
    if (socket && localRef.current && remoteRef.current) {
      usePartyVideo(socket, partyId, localRef.current, remoteRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, partyId]);

  return (
    <div className="relative px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Listen Party</h1>
        <div className="flex gap-2">
          <Button variant={role === "leader" ? "default" : "outline"} onClick={() => setRole("leader")}>Leader</Button>
          <Button variant={role === "follower" ? "default" : "outline"} onClick={() => setRole("follower")}>Follower</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="relative rounded-xl border border-zinc-800/60 p-3 overflow-hidden">
          <div className="text-sm text-zinc-400 mb-2">Video Call</div>
          <div className="grid grid-cols-2 gap-2">
            <video ref={localRef} className="w-full rounded-lg bg-black" autoPlay muted playsInline />
            <video ref={remoteRef} className="w-full rounded-lg bg-black" autoPlay playsInline />
          </div>
        </div>

        <div className="relative rounded-xl border border-zinc-800/60 p-3 overflow-hidden">
          <div className="text-sm text-zinc-400 mb-2">Reactions</div>
          <div className="flex gap-2">
            {["🎧","🔥","👏","💚","🎵","🤘"].map((e) => (
              <Button
                key={e}
                variant="secondary"
                onClick={() => socket?.emit("party:emoji", { partyId, emoji: e })}
              >
                {e}
              </Button>
            ))}
          </div>
          <EmojiLayer bus={bus} />
        </div>
      </div>
    </div>
  );
}
