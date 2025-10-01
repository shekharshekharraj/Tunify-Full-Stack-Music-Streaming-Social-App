// frontend/src/hooks/usePartyVideo.ts
import { useEffect, useRef, useState } from "react";

type Controls = {
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  micOn: boolean;
  camOn: boolean;
  connected: boolean;
  isCalling: boolean;      // ◀️ expose calling state
};

export function usePartyVideo(
  socket: any,
  partyId: string,
  localRef: React.RefObject<HTMLVideoElement | null>,
  remoteRef: React.RefObject<HTMLVideoElement | null>
): Controls {
  const [connected, setConnected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const ensureLocal = () => {
    const v = localRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    if (localStream.current && v.srcObject !== localStream.current) {
      v.srcObject = localStream.current;
    }
  };
  const ensureRemote = () => {
    const v = remoteRef.current;
    if (!v) return;
    v.muted = false;       // we want to hear the other side during a call
    v.playsInline = true;
    if (!remoteStream.current) remoteStream.current = new MediaStream();
    if (v.srcObject !== remoteStream.current) v.srcObject = remoteStream.current;
  };

  const getPC = () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("party:webrtc-ice", { partyId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };
    pc.ontrack = (e) => {
      ensureRemote();
      const tracks = e.streams?.[0]?.getTracks()?.length ? e.streams[0].getTracks() : [e.track];
      if (!remoteStream.current) remoteStream.current = new MediaStream();
      tracks.forEach((t) => {
        if (!remoteStream.current!.getTracks().some((x) => x.id === t.id)) {
          remoteStream.current!.addTrack(t);
        }
      });
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    if (!socket || !partyId) return;
    const pc = getPC();

    // get mic/cam
    if (!localStream.current) {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
        video: camOn
          ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } }
          : false,
      });
    }
    ensureLocal();

    // add tracks
    localStream.current.getTracks().forEach((t) => pc.addTrack(t, localStream.current!));

    // negotiation
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socket.emit("party:webrtc-offer", { partyId, sdp: pc.localDescription });

    setIsCalling(true);
  };

  const reallyTearDown = () => {
    try {
      pcRef.current?.getSenders?.().forEach((s) => s.track?.stop());
      pcRef.current?.getReceivers?.().forEach((r) => r.track?.stop());
    } catch {}
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    try {
      localStream.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStream.current = null;
    if (localRef.current) localRef.current.srcObject = null;

    try {
      remoteStream.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    remoteStream.current = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;

    setConnected(false);
    setIsCalling(false);
  };

  const endCall = () => {
    // tell the room to end too
    socket.emit("party:call:end", { partyId });
    reallyTearDown();
  };

  const toggleMic = () => {
    setMicOn((on) => {
      localStream.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  };
  const toggleCam = () => {
    setCamOn((on) => {
      localStream.current?.getVideoTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  };

  // signaling
  useEffect(() => {
    if (!socket || !partyId) return;

    const onOffer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const pc = getPC();
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      if (!localStream.current) {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          video: camOn ? true : false,
        });
        ensureLocal();
        localStream.current.getTracks().forEach((t) => pc.addTrack(t, localStream.current!));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("party:webrtc-answer", { partyId, sdp: pc.localDescription });
      setIsCalling(true);
    };

    const onAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const pc = getPC();
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = getPC();
      try { await pc.addIceCandidate(candidate); } catch {}
    };

    const onCallEnd = () => {
      // remote asked to end
      reallyTearDown();
    };

    socket.on("party:webrtc-offer", onOffer);
    socket.on("party:webrtc-answer", onAnswer);
    socket.on("party:webrtc-ice", onIce);
    socket.on("party:call:end", onCallEnd);

    ensureRemote();
    ensureLocal();

    return () => {
      socket.off("party:webrtc-offer", onOffer);
      socket.off("party:webrtc-answer", onAnswer);
      socket.off("party:webrtc-ice", onIce);
      socket.off("party:call:end", onCallEnd);
      reallyTearDown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, partyId]);

  return { startCall, endCall, toggleMic, toggleCam, micOn, camOn, connected, isCalling };
}
