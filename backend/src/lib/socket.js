// backend/lib/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

const userSockets = new Map();    // Clerk ID -> socket.id
const userActivities = new Map(); // Clerk ID -> activity string

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000", "http://localhost:3001",
        "http://localhost:3002", "http://localhost:3003",
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // IMPORTANT: auth.userId is EXPECTED to be Clerk ID
    const clerkUserId = socket.handshake.auth.userId;
    if (!clerkUserId) return socket.disconnect();

    userSockets.set(clerkUserId, socket.id);
    userActivities.set(clerkUserId, "Idle");

    io.emit("users_online", Array.from(userSockets.keys()));
    io.emit("activities", Array.from(userActivities.entries()));

    socket.on("update_activity", ({ activity }) => {
      if (clerkUserId) {
        userActivities.set(clerkUserId, activity);
        socket.broadcast.emit("activity_updated", { userId: clerkUserId, activity });
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data; // Mongo IDs
        const receiverUser = await User.findById(receiverId).select("clerkId");
        if (!receiverUser) return;

        const message = await Message.create({ sender: senderId, receiver: receiverId, content });

        const receiverSocketId = userSockets.get(receiverUser.clerkId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }
        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
      }
    });

    socket.on("disconnect", () => {
      if (clerkUserId) {
        userSockets.delete(clerkUserId);
        userActivities.delete(clerkUserId);
        io.emit("users_online", Array.from(userSockets.keys()));
      }
    });
  });

  return io;
};
