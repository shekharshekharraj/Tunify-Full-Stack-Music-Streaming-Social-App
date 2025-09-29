import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { usePartySync } from "@/hooks/usePartySync";
import { usePartyVideo } from "@/hooks/usePartyVideo";

const API = import.meta.env.VITE_API_BASE || "";

export default function PartyPage() {
  const { partyId: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // role comes from ?role=leader|follower (default leader)
  const search = new URLSearchParams(location.search);
  const role = (search.get("role") === "follower" ? "follower" : "leader") as
    | "leader"
    | "follower";

  const [partyId, setPartyId] = useState(paramId || "");
  const socket = useMemo(() => io(API || "/", { path: "/socket.io" }), []);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  // ---- FIX: pass all 3 args: partyId, role, getAudioEl
  usePartySync(partyId, role, () => {
    return document.getElementById("global-audio") as HTMLAudioElement | null;
  });

  // WebRTC video chat hookup
  usePartyVideo(socket, partyId, localRef.current, remoteRef.current);

  // Ensure we have a party id in the URL
  useEffect(() => {
    if (!paramId) {
      const newId = Math.random().toString(36).slice(2, 8);
      navigate(`/party/${newId}?role=${role}`, { replace: true });
      setPartyId(newId);
    } else {
      setPartyId(paramId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  // Join socket room & cleanup
  useEffect(() => {
    if (partyId) socket.emit("party:join", { partyId });
    return () => {
      socket.disconnect();
    };
  }, [socket, partyId]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-baseline gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Watch Party: {partyId || "…"}</h1>
        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200">{role}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          className="w-full aspect-video rounded-lg bg-black/40"
        />
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="w-full aspect-video rounded-lg bg-black/40"
        />
      </div>

      <p className="text-sm text-zinc-500 mt-3">
        Share this link with a friend to sync playback &amp; video chat:
        <br />
        <span className="text-emerald-400 break-all">{window.location.href}</span>
      </p>

      <p className="text-xs text-zinc-500 mt-2">
        Tip: send them the same URL but with <code>?role=follower</code> appended if you want to be the leader.
      </p>
    </div>
  );
}
