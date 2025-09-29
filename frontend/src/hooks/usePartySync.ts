import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type LeaderState = {
  songId?: string;
  audioUrl?: string;
  positionMs: number;
  isPlaying: boolean;
  at: number; // leader Date.now()
};

export function usePartySync(
  partyId: string,
  role: "leader" | "follower",
  getAudioEl: () => HTMLAudioElement | null
) {
  const socketRef = useRef<Socket | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const s = io("/party", { withCredentials: true });
    socketRef.current = s;
    s.emit("party:join", { partyId, user: { id: "me" } });

    const audio = getAudioEl();

    if (role === "leader" && audio) {
      const tick = () => {
        const a = getAudioEl();
        if (!a) return;
        s.emit("party:leader-state", {
          partyId,
          state: {
            positionMs: Math.floor(a.currentTime * 1000),
            isPlaying: !a.paused,
            audioUrl: a.src || undefined,
            at: Date.now(),
          },
        });
      };
      tickRef.current = window.setInterval(tick, 2000) as unknown as number;

      const instant = () => tick();
      ["play", "pause", "seeking", "seeked"].forEach((ev) =>
        audio.addEventListener(ev, instant)
      );

      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
        ["play", "pause", "seeking", "seeked"].forEach((ev) =>
          audio.removeEventListener(ev, instant)
        );
        s.emit("party:leave", { partyId, user: { id: "me" } });
        s.disconnect();
      };
    }

    // follower
    const onSync = async (st: LeaderState) => {
      const a = getAudioEl();
      if (!a) return;
      try {
        if (st.audioUrl && a.src !== st.audioUrl) {
          a.crossOrigin = "anonymous";
          a.src = st.audioUrl;
          a.load();
        }
        const now = Date.now();
        const target = (st.positionMs + (now - st.at)) / 1000;
        const drift = a.currentTime - target;
        if (Math.abs(drift) > 0.3) a.currentTime = target;
        if (st.isPlaying && a.paused) await a.play();
        if (!st.isPlaying && !a.paused) a.pause();
      } catch {}
    };

    s.on("party:sync", onSync);

    return () => {
      s.off("party:sync", onSync);
      s.emit("party:leave", { partyId, user: { id: "me" } });
      s.disconnect();
    };
  }, [partyId, role, getAudioEl]);
}
