import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePartyVideo } from "@/hooks/usePartyVideo";
import { usePartySync } from "@/hooks/usePartySync";
import NowPlayingStage from "@/components/party/NowPlayingStage";
import PartyChat from "@/components/party/PartyChat";
import PartyReactions from "@/components/party/PartyReactions";

const SOCKET_BASE =
  (import.meta.env.VITE_SOCKET_URL && String(import.meta.env.VITE_SOCKET_URL).trim()) ||
  "http://localhost:5000";

type Role = "leader" | "follower";
type PresenceUsers = { id?: string }[];
type PresenceEvent = { users: PresenceUsers };
type PresenceAck = { users?: PresenceUsers; size?: number };
type EmojiEvent = { emoji: string };

// -------- helpers: find & normalize cover URL --------
function pickCoverUrl(t: any): string | null {
  if (!t) return null;
  const direct =
    t.imageUrl || t.coverUrl || t.image || t.artworkUrl || t.thumbnail || t.thumbnailUrl || t.picture;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (t.image?.url) return t.image.url;
  if (t.cover?.url) return t.cover.url;
  if (t.artwork?.url) return t.artwork.url;
  if (Array.isArray(t.album?.images) && t.album.images.length) {
    const img = t.album.images.find((x: any) => x?.url) || t.album.images[0];
    if (img?.url) return img.url;
  }
  if (t.metadata?.image) return t.metadata.image;
  if (t.meta?.image) return t.meta.image;
  if (t.artwork_url) return t.artwork_url;
  if (t.user?.avatar_url) return t.user.avatar_url;
  return null;
}

function normalizeCoverUrl(u: string | null): string | null {
  if (!u) return null;
  const url = u.trim();
  if (url.startsWith("blob:")) return null;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return null;
}
// -----------------------------------------------------

export default function PartyRoom() {
  const params = useParams();
  const [search] = useSearchParams();

  const partyId = ((params.partyId || (params as any).codeOrId || "") as string).trim();
  const role: Role = search.get("role") === "follower" ? "follower" : "leader";

  const { audioNodes, currentSong, queue, currentIndex, setFromPartyMeta } =
    usePlayerStore() as any;

  // single socket instance
  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io(`${SOCKET_BASE}/party`, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 600,
    });
    socketRef.current.on("connect_error", (err) => {
      console.warn("[party] connect_error:", err?.message, err);
    });
  }
  const socket = socketRef.current;

  const [participantCount, setParticipantCount] = useState(1);

  const bus = useMemo(() => new EventTarget(), []);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  // connect + presence
  useEffect(() => {
    if (!partyId) return;

    if (socket.connected) socket.disconnect();
    socket.auth = { partyId };
    socket.connect();

    const onConnect = () => {
      socket.emit("party:join", { partyId, user: { id: socket.id } });
      socket.emit("party:presence:get", { partyId }, (resp: PresenceAck) => {
        const list = resp?.users || [];
        setParticipantCount(list.length);
      });
    };
    const onPresence = (payload: PresenceEvent) => {
      const list = payload?.users || [];
      setParticipantCount(list.length);
    };
    const onEmoji = ({ emoji }: EmojiEvent) => {
      bus.dispatchEvent(new CustomEvent("emoji", { detail: emoji }));
    };
    const onDisconnect = () => setParticipantCount(1);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("party:presence", onPresence);
    socket.on("party:emoji", onEmoji);

    return () => {
      socket.emit("party:leave", { partyId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("party:presence", onPresence);
      socket.off("party:emoji", onEmoji);
      socket.disconnect();
    };
  }, [partyId, socket, bus]);

  const getAudioEl = () =>
    (audioNodes?.audioElement as HTMLAudioElement | null) ||
    (document.getElementById("global-audio") as HTMLAudioElement | null);

  const getLeaderTrackObject = () => {
    return (
      currentSong ??
      (Array.isArray(queue) ? queue[currentIndex] : null) ??
      (Array.isArray(queue) ? queue[0] : null) ??
      null
    );
  };

  const getTrackInfo = () => {
    const t = getLeaderTrackObject() || {};
    const raw = pickCoverUrl(t);
    const cover = normalizeCoverUrl(raw);

    return {
      id: t.id ?? (t as any)._id ?? null,
      title: t.title ?? t.name ?? null,
      artist:
        t.artist ??
        (Array.isArray(t.artists) ? t.artists.join(", ") : (t.artists as any)) ??
        (t.album?.artists && Array.isArray(t.album.artists)
          ? t.album.artists.map((a: any) => a?.name || a).join(", ")
          : null),
      coverUrl: cover,
      durationMs: t.durationMs ?? t.duration ?? t.duration_ms ?? null,
      audioUrl: (t as any).audioUrl || (getAudioEl()?.src ?? null),
    };
  };

  const sync = usePartySync(socket, partyId, role, getAudioEl, getTrackInfo);

  useEffect(() => {
    if (role !== "follower") return;
    if (!sync.track) return;
    setFromPartyMeta?.(sync.track);
  }, [role, sync.track, setFromPartyMeta]);

  const {
    startCall,
    endCall,
    toggleMic,
    toggleCam,
    micOn,
    camOn,
    isCalling,
  } = usePartyVideo(socket, partyId, localRef, remoteRef);

  const [tab, setTab] = useState<"chat" | "reactions">("chat");

  // ===== Build a canonical share URL that always forces follower role =====
  const shareUrl = useMemo(() => {
    if (!partyId) return window.location.href; // fallback
    return `${window.location.origin}/party/${encodeURIComponent(partyId)}?role=follower`;
  }, [partyId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Top bar with Tunify logo (left) and call controls (right) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" aria-label="Go to Tunify Home">
            <img
              src="/Tunify.png"
              alt="Tunify"
              className="h-7 w-auto rounded-[6px] shadow-sm"
              draggable={false}
            />
            <span className="text-white font-semibold tracking-tight">Tunify</span>
          </Link>

          <h1 className="text-xl font-semibold">
            Watch Party: {partyId || "—"}{" "}
            <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs align-middle">
              {role} • {participantCount} in room
            </span>
          </h1>
        </div>

        <div className="flex gap-2">
          {!isCalling ? (
            <Button onClick={startCall} className="bg-emerald-600 hover:bg-emerald-500">
              Start Call
            </Button>
          ) : (
            <Button variant="destructive" onClick={endCall}>
              End
            </Button>
          )}
          <Button variant="outline" onClick={toggleMic}>{micOn ? "Mute" : "Unmute"}</Button>
          <Button variant="outline" onClick={toggleCam}>{camOn ? "Cam Off" : "Cam On"}</Button>
        </div>
      </div>

      {/* Stage */}
      <div className="relative rounded-xl border border-zinc-800/60 bg-black/40 overflow-hidden aspect-video">
        <NowPlayingStage
          track={sync.track}
          isPlaying={sync.isPlaying}
          positionMs={sync.positionMs}
        />

        {/* Remote PiP only while calling */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={
            "absolute bottom-3 left-3 w-40 h-28 rounded-lg ring-1 ring-white/20 bg-black/60 object-cover z-10 " +
            (isCalling ? "" : "opacity-0 pointer-events-none")
          }
        />

        {/* Local PiP (muted) */}
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-3 right-3 w-40 h-28 rounded-lg ring-1 ring-white/20 bg-black/60 object-cover"
        />
      </div>

      <p className="text-sm text-zinc-500 mt-3">
        Share this follower link with a friend to sync playback & talk:
        <br />
        <a className="text-emerald-400 break-all" href={shareUrl} target="_blank" rel="noreferrer">
          {shareUrl}
        </a>
        <br />
        (This link always opens the room as a <code>follower</code>.)
      </p>

      <div className="mt-6">
        <div className="flex gap-2 mb-3">
          <Button variant={tab === "chat" ? "default" : "outline"} onClick={() => setTab("chat")}>Chat</Button>
          <Button variant={tab === "reactions" ? "default" : "outline"} onClick={() => setTab("reactions")}>Reactions</Button>
        </div>
        {tab === "chat" ? (
          <PartyChat socket={socket} partyId={partyId} role={role} />
        ) : (
          <PartyReactions socket={socket} partyId={partyId} bus={bus} />
        )}
      </div>
    </div>
  );
}
