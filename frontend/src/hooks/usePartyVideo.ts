import { useEffect } from "react";

type MinimalSocket = {
  emit: (event: string, payload?: any) => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb: (...args: any[]) => void) => void;
};

type OfferPayload = { sdp: RTCSessionDescriptionInit };
type AnswerPayload = { sdp: RTCSessionDescriptionInit };
type IcePayload = { candidate: RTCIceCandidateInit };

export function usePartyVideo(
  socket: MinimalSocket | null | undefined,
  partyId: string,
  localVideo: HTMLVideoElement | null,
  remoteVideo: HTMLVideoElement | null
) {
  useEffect(() => {
    if (!socket || !partyId) return;

    let pc: RTCPeerConnection | null = null;
    let localStream: MediaStream | null = null;
    let started = false;

    const start = async () => {
      if (started) return;
      started = true;

      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Show remote tracks
      pc.ontrack = (e: RTCTrackEvent) => {
        const [stream] = e.streams;
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
          remoteVideo
            .play()
            .catch(() => {/* autoplay will resume after user gesture */});
        }
      };

      // Send ICE to peer
      pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate) {
          socket.emit("party:webrtc-ice", { partyId, candidate: e.candidate.toJSON() });
        }
      };

      // Get local media
      if (!navigator.mediaDevices?.getUserMedia) return;
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.muted = true; // avoid echo locally
        localVideo
          .play()
          .catch(() => {/* user gesture may be required */});
      }

      // Add local tracks to connection
      localStream.getTracks().forEach((t) => pc!.addTrack(t, localStream!));

      // Become the offerer by default
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("party:webrtc-offer", { partyId, sdp: offer });
    };

    const onOffer = async ({ sdp }: OfferPayload) => {
      // If we haven't started yet, start as the answerer
      if (!pc) {
        await start();
      }
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("party:webrtc-answer", { partyId, sdp: answer });
    };

    const onAnswer = async ({ sdp }: AnswerPayload) => {
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const onIce = async ({ candidate }: IcePayload) => {
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // swallow ICE add errors (can happen with race conditions)
      }
    };

    socket.on("party:webrtc-offer", onOffer);
    socket.on("party:webrtc-answer", onAnswer);
    socket.on("party:webrtc-ice", onIce);

    // Kick things off as offerer
    void start();

    return () => {
      socket.off("party:webrtc-offer", onOffer);
      socket.off("party:webrtc-answer", onAnswer);
      socket.off("party:webrtc-ice", onIce);

      try { pc?.getSenders().forEach((s) => s.track && s.track.stop()); } catch {}
      try { localStream?.getTracks().forEach((t) => t.stop()); } catch {}
      try { pc?.close(); } catch {}

      pc = null;
      localStream = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, partyId, localVideo, remoteVideo]);
}
