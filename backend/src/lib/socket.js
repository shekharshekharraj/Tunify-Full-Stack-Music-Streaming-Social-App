// backend/lib/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

const userSockets = new Map();    // Clerk ID -> socket.id
const userActivities = new Map(); // Clerk ID -> activity string

export const initializeSocket = (server, allowedOriginsArr = []) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOriginsArr.includes(origin)) return cb(null, true);
        return cb(new Error(`Socket CORS blocked: ${origin}`));
      },
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    const clerkUserId = socket.handshake?.auth?.userId;
    if (!clerkUserId) {
      socket.emit("error", "Unauthorized: missing userId in socket auth");
      return socket.disconnect();
    }

    userSockets.set(clerkUserId, socket.id);
    userActivities.set(clerkUserId, "Idle");

    io.emit("users_online", Array.from(userSockets.keys()));
    io.emit("activities", Array.from(userActivities.entries()));

    socket.on("update_activity", ({ activity }) => {
      const value = activity || "Idle";
      userActivities.set(clerkUserId, value);
      socket.broadcast.emit("activity_updated", { userId: clerkUserId, activity: value });
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data; // Mongo IDs
        if (!senderId || !receiverId || !content) return;

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
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("disconnect", () => {
      userSockets.delete(clerkUserId);
      userActivities.delete(clerkUserId);
      io.emit("users_online", Array.from(userSockets.keys()));
    });
  });

  return io;
};
