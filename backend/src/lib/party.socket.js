// Socket.IO namespace for Listen Party (voice/video + chat + reactions + sync)
export function initPartyNamespace(io) {
  const nsp = io.of("/party");

  // partyId -> Map(socketId -> user)
  const roomUsers = new Map();
  // partyId -> latest leader state (so newcomers see the current track/art instantly)
  const lastLeaderState = new Map();

  const sizeOf = (partyId) => nsp.adapter.rooms.get(partyId)?.size || 0;
  const log = (...a) => console.log("[party]", ...a);

  function joinRoom(socket, partyId, user) {
    if (!partyId) return;
    socket.join(partyId);
    if (!roomUsers.has(partyId)) roomUsers.set(partyId, new Map());
    roomUsers.get(partyId).set(socket.id, user || { id: socket.id });

    log("join", { partyId, socket: socket.id, size: sizeOf(partyId) });

    nsp.to(partyId).emit("party:presence", {
      type: "join",
      user: user || { id: socket.id },
      users: Array.from(roomUsers.get(partyId).values()),
    });

    // hydrate this socket with the latest leader state (artwork, position, etc.)
    const snapshot = lastLeaderState.get(partyId);
    if (snapshot) {
      socket.emit("party:sync", snapshot);
    }
  }

  nsp.on("connection", (socket) => {
    const authPid = socket.handshake?.auth?.partyId;
    const qPid = socket.handshake?.query?.partyId;
    const handshakePartyId = (authPid || qPid || "").trim();

    log("connected", socket.id, "auth:", socket.handshake?.auth, "query:", socket.handshake?.query);

    // If a partyId is provided at handshake, auto-join
    if (handshakePartyId) {
      joinRoom(socket, handshakePartyId, { id: socket.id });
    }

    // Explicit join (kept for safety)
    socket.on("party:join", ({ partyId, user }) => {
      log("party:join", { partyId, socket: socket.id });
      joinRoom(socket, (partyId || "").trim(), user);
    });

    // Presence probe (ack)
    socket.on("party:presence:get", ({ partyId }, ack) => {
      const pid = (partyId || "").trim();
      const users = pid && roomUsers.get(pid) ? Array.from(roomUsers.get(pid).values()) : [];
      log("presence:get", { partyId: pid, socket: socket.id, size: sizeOf(pid) });
      if (typeof ack === "function") ack({ users, size: sizeOf(pid) });
    });

    // Leave room
    socket.on("party:leave", ({ partyId }) => {
      const pid = (partyId || "").trim();
      socket.leave(pid);
      const rm = roomUsers.get(pid);
      if (rm) rm.delete(socket.id);
      log("leave", { partyId: pid, socket: socket.id, size: sizeOf(pid) });

      nsp.to(pid).emit("party:presence", {
        type: "leave",
        user: { id: socket.id },
        users: rm ? Array.from(rm.values()) : [],
      });

      // also tell peers to end any active calls with this socket
      nsp.to(pid).emit("party:call:end", { from: socket.id });
    });

    // ===== Music sync (leader -> followers) =====
    socket.on("party:leader-state", ({ partyId, state }) => {
      const pid = (partyId || "").trim();
      if (!pid || !state) return;
      // store snapshot for late joiners
      lastLeaderState.set(pid, state);
      socket.to(pid).emit("party:sync", state);
    });

    // ===== Chat =====
    socket.on("party:chat", (msg) => {
      const pid = (msg?.partyId || "").trim();
      if (!pid) return;
      nsp.to(pid).emit("party:chat", msg);
    });

    // ===== Emoji reactions =====
    socket.on("party:emoji", ({ partyId, emoji }) => {
      const pid = (partyId || "").trim();
      if (!pid || !emoji) return;
      nsp.to(pid).emit("party:emoji", { emoji, ts: Date.now() });
    });

    // ===== WebRTC signaling =====
    socket.on("party:webrtc-offer", ({ partyId, sdp }) => {
      const pid = (partyId || "").trim();
      if (!pid || !sdp) return;
      log("offer", { partyId: pid, from: socket.id });
      socket.to(pid).emit("party:webrtc-offer", { sdp });
    });

    socket.on("party:webrtc-answer", ({ partyId, sdp }) => {
      const pid = (partyId || "").trim();
      if (!pid || !sdp) return;
      log("answer", { partyId: pid, from: socket.id });
      socket.to(pid).emit("party:webrtc-answer", { sdp });
    });

    socket.on("party:webrtc-ice", ({ partyId, candidate }) => {
      const pid = (partyId || "").trim();
      if (!pid || !candidate) return;
      log("ice", { partyId: pid, from: socket.id });
      socket.to(pid).emit("party:webrtc-ice", { candidate });
    });

    // ===== Call End broadcast (so one user can end for both) =====
    socket.on("party:call:end", ({ partyId }) => {
      const pid = (partyId || "").trim();
      if (!pid) return;
      log("call:end", { partyId: pid, from: socket.id });
      nsp.to(pid).emit("party:call:end", { from: socket.id });
    });

    // Cleanup on disconnect — update presence and make sure peers tear down calls
    socket.on("disconnecting", () => {
      for (const pid of socket.rooms) {
        if (pid === socket.id) continue;
        const rm = roomUsers.get(pid);
        if (!rm) continue;
        rm.delete(socket.id);
        log("disconnecting", { partyId: pid, socket: socket.id, size: sizeOf(pid) });

        nsp.to(pid).emit("party:presence", {
          type: "leave",
          user: { id: socket.id },
          users: Array.from(rm.values()),
        });

        // proactively tell peers to end call with this socket
        nsp.to(pid).emit("party:call:end", { from: socket.id });
      }
    });
  });
}
