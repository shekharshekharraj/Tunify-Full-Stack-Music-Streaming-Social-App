import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type PartyTrack = {
  id?: string | null;
  title?: string | null;
  artist?: string | null;
  coverUrl?: string | null;
  durationMs?: number | null;
  audioUrl?: string | null;
};
export type TrackMeta = PartyTrack;

type LeaderState = {
  positionMs: number;
  isPlaying: boolean;
  at: number;        // leader Date.now()
  audioUrl?: string; // duplicated for followers’ convenience
  meta?: TrackMeta;  // includes coverUrl
};

const TICK_MS = 1500;

// shallow compare for TrackMeta (good enough to prevent loops)
function shallowEqualTrack(a?: TrackMeta | null, b?: TrackMeta | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.artist === b.artist &&
    a.coverUrl === b.coverUrl &&
    a.durationMs === b.durationMs &&
    a.audioUrl === b.audioUrl
  );
}

export function usePartySync(
  socket: Socket,
  partyId: string,
  role: "leader" | "follower",
  getAudioEl: () => HTMLAudioElement | null,
  getTrackInfo?: () => TrackMeta | null
) {
  const tickRef = useRef<number | null>(null);
  const getAudioRef = useRef(getAudioEl);
  const getInfoRef = useRef(getTrackInfo);

  // keep latest function references without re-running the effect
  useEffect(() => { getAudioRef.current = getAudioEl; }, [getAudioEl]);
  useEffect(() => { getInfoRef.current = getTrackInfo; }, [getTrackInfo]);

  const [track, setTrack] = useState<TrackMeta | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    if (!socket || !partyId) return;

    // ----- Leader: send state + metadata -----
    if (role === "leader") {
      const send = () => {
        if (!socket.connected) return;
        const a = getAudioRef.current?.();
        if (!a) return;

        const meta = getInfoRef.current?.() || undefined;

        // expose last-emitted cover for console checks (optional)
        (window as any).__lastEmitCoverUrl = meta?.coverUrl ?? null;

        // only update local UI when meta actually changed
        if (!shallowEqualTrack(track, meta || null)) {
          setTrack(meta || null);
        }
        const playing = !a.paused;
        const posMs = Math.floor((a.currentTime || 0) * 1000);
        if (isPlaying !== playing) setIsPlaying(playing);
        setPositionMs(posMs);

        const payload: LeaderState = {
          positionMs: posMs,
          isPlaying: playing,
          at: Date.now(),
          audioUrl: meta?.audioUrl || (a.src || undefined),
          meta,
        };

        socket.emit("party:leader-state", { partyId, state: payload });
      };

      // ensure we have only one interval
      if (tickRef.current != null) {
        clearInterval(tickRef.current as any);
        tickRef.current = null;
      }
      tickRef.current = window.setInterval(send, TICK_MS) as unknown as number;

      // instant sends around user actions
      const a = getAudioRef.current?.();
      const instant = () => send();
      const instEvts: Array<keyof HTMLMediaElementEventMap> = [
        "play", "pause", "seeking", "seeked", "loadedmetadata"
      ];
      if (a) instEvts.forEach((ev) => a.addEventListener(ev, instant));

      // send once immediately and on reconnect
      send();
      const onConnected = () => send();
      socket.on("connect", onConnected);

      return () => {
        if (tickRef.current != null) {
          clearInterval(tickRef.current as any);
          tickRef.current = null;
        }
        if (a) instEvts.forEach((ev) => a.removeEventListener(ev, instant));
        socket.off("connect", onConnected);
      };
    }

    // ----- Follower: consume sync + apply to <audio> and UI -----
    const onSync = async (st: LeaderState) => {
      const a = getAudioRef.current?.();
      if (!a) return;

      try {
        (window as any).__lastRecvCoverUrl = st?.meta?.coverUrl ?? null;

        // update UI meta only if changed
        if (st.meta && !shallowEqualTrack(track, st.meta)) {
          setTrack(st.meta);
        }

        // keep source aligned
        const wantSrc = st.audioUrl || st.meta?.audioUrl || undefined;
        if (wantSrc && a.src !== wantSrc) {
          try { a.crossOrigin = "anonymous"; } catch {}
          a.preload = "auto";
          a.src = wantSrc;
          try { a.load(); } catch {}
        }

        // adjust clock if drift is noticeable
        const now = Date.now();
        const target = (st.positionMs + (now - st.at)) / 1000;
        const drift = (a.currentTime || 0) - target;
        if (Math.abs(drift) > 0.25) {
          try { a.currentTime = target; } catch {}
        }

        // match play/pause
        if (st.isPlaying && a.paused) {
          try { await a.play(); } catch {}
        } else if (!st.isPlaying && !a.paused) {
          try { a.pause(); } catch {}
        }

        if (isPlaying !== st.isPlaying) setIsPlaying(st.isPlaying);
        setPositionMs(Math.floor(target * 1000));
      } catch {
        // swallow tiny races
      }
    };

    socket.on("party:sync", onSync);
    return () => {
      socket.off("party:sync", onSync);
    };
  // IMPORTANT: do NOT include getAudioEl/getTrackInfo in deps
  }, [socket, partyId, role, isPlaying, track]);

  return { track, isPlaying, positionMs };
}
