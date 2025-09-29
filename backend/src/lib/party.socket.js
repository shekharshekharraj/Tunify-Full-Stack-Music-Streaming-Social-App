// Socket.IO namespace for listen-party
export function initPartyNamespace(io) {
  const nsp = io.of("/party");

  // In-memory roster (optional and simple)
  const roomUsers = new Map(); // partyId -> Map(socketId -> user)

  nsp.on("connection", (socket) => {
    socket.on("party:join", ({ partyId, user }) => {
      socket.join(partyId);
      if (!roomUsers.has(partyId)) roomUsers.set(partyId, new Map());
      roomUsers.get(partyId).set(socket.id, user || { id: socket.id });

      nsp.to(partyId).emit("party:presence", {
        type: "join",
        user,
        users: Array.from(roomUsers.get(partyId).values()),
      });
    });

    socket.on("party:leave", ({ partyId }) => {
      socket.leave(partyId);
      const rm = roomUsers.get(partyId);
      if (rm) {
        rm.delete(socket.id);
        nsp.to(partyId).emit("party:presence", {
          type: "leave",
          user: { id: socket.id },
          users: Array.from(rm.values()),
        });
      }
    });

    // Leader broadcasts canonical playback state regularly + on user actions
    socket.on("party:leader-state", ({ partyId, state }) => {
      // state = { songId?, audioUrl?, positionMs, isPlaying, at: Date.now() }
      socket.to(partyId).emit("party:sync", state);
    });

    // Text chat
    socket.on("party:chat", ({ partyId, message }) => {
      nsp.to(partyId).emit("party:chat", { message, ts: Date.now() });
    });

    // Emoji reactions
    socket.on("party:emoji", ({ partyId, emoji }) => {
      nsp.to(partyId).emit("party:emoji", { emoji, ts: Date.now() });
    });

    // WebRTC signaling
    socket.on("party:webrtc-offer", ({ partyId, to, sdp, from }) => {
      socket.to(partyId).emit("party:webrtc-offer", { from: from || socket.id, to, sdp });
    });
    socket.on("party:webrtc-answer", ({ partyId, to, sdp, from }) => {
      socket.to(partyId).emit("party:webrtc-answer", { from: from || socket.id, to, sdp });
    });
    socket.on("party:webrtc-ice", ({ partyId, to, candidate, from }) => {
      socket.to(partyId).emit("party:webrtc-ice", { from: from || socket.id, to, candidate });
    });

    socket.on("disconnecting", () => {
      for (const partyId of socket.rooms) {
        if (partyId === socket.id) continue;
        const rm = roomUsers.get(partyId);
        if (rm) {
          rm.delete(socket.id);
          nsp.to(partyId).emit("party:presence", {
            type: "leave",
            user: { id: socket.id },
            users: Array.from(rm.values()),
          });
        }
      }
    });
  });
}
