import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

interface SocketAuth {
  userId: string; // Clerk ID expected by server
}

interface ChatStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  userActivities: Map<string, string>;
  messages: Message[];
  selectedUser: User | null;
  currentUserDb: User | null;
  unreadCounts: Map<string, number>;

  fetchUsers: (clerkId: string) => Promise<void>;
  initSocket: (clerkId: string) => void; // Clerk ID
  disconnectSocket: () => void;
  sendMessage: (receiverId: string, content: string) => void;
  fetchMessages: (clerkId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  toggleFollow: (targetUserClerkId: string) => Promise<void>;
  resetUnreadCount: (clerkId: string) => void;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";
const socketInstance = io(baseURL, { autoConnect: false, withCredentials: true });

export const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  socket: socketInstance,
  isConnected: false,
  onlineUsers: new Set(),
  userActivities: new Map(),
  messages: [],
  selectedUser: null,
  currentUserDb: null,
  unreadCounts: new Map(),

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
    if (user) {
      get().fetchMessages(user.clerkId);
      get().resetUnreadCount(user.clerkId);
    }
  },

  resetUnreadCount: (clerkId) => {
    set((state) => {
      const newCounts = new Map(state.unreadCounts);
      if (newCounts.has(clerkId)) {
        newCounts.set(clerkId, 0);
        return { unreadCounts: newCounts };
      }
      return {};
    });
  },

  fetchUsers: async (_clerkId) => {
    set({ isLoading: true, error: null });
    try {
      const [usersResponse, currentUserResponse] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get(`/users/me`),
      ]);

      const otherUsers: User[] = usersResponse.data;
      const currentUser: User = currentUserResponse.data;

      if (currentUser && Array.isArray(currentUser.following)) {
        const followingSet = new Set(currentUser.following.map(String));
        const updatedUsers = otherUsers.map((u) => ({
          ...u,
          isFollowing: followingSet.has(u._id),
        }));
        set({ users: updatedUsers, currentUserDb: currentUser });
      } else {
        set({ users: otherUsers, currentUserDb: currentUser });
      }
    } catch (error: any) {
      set({ error: "Failed to fetch users" });
      toast.error("Failed to fetch users");
    } finally {
      set({ isLoading: false });
    }
  },

  initSocket: (clerkId) => {
    const socket = get().socket;
    if (!socket || get().isConnected) return;

    socket.auth = { userId: clerkId } as SocketAuth; // Clerk ID for server mapping
    socket.connect();

    socket.on("connect", () => set({ isConnected: true }));
    socket.on("disconnect", () => set({ isConnected: false }));

    socket.on("users_online", (onlineUserIds: string[]) => {
      set({ onlineUsers: new Set(onlineUserIds) });
    });

    socket.on("activities", (activities: [string, string][]) => {
      set({ userActivities: new Map(activities) });
    });

    socket.on("activity_updated", ({ userId: activityUserId, activity }) => {
      set((state) => {
        const newActivities = new Map(state.userActivities);
        newActivities.set(activityUserId, activity);
        return { userActivities: newActivities };
      });
    });

    socket.on("receive_message", (message: Message) => {
      const { selectedUser, currentUserDb } = get();

      const isMessageForSelectedChat =
        (selectedUser?._id === message.sender && currentUserDb?._id === message.receiver) ||
        (selectedUser?._id === message.receiver && currentUserDb?._id === message.sender);

      if (isMessageForSelectedChat) {
        set((state) => ({ messages: [...state.messages, message] }));
        if (selectedUser?.clerkId) get().resetUnreadCount(selectedUser.clerkId);
      } else {
        const sender = get().users.find((u) => u._id === message.sender);
        if (sender?.clerkId) {
          set((state) => {
            const newUnreadCounts = new Map(state.unreadCounts);
            const currentCount = newUnreadCounts.get(sender.clerkId) || 0;
            newUnreadCounts.set(sender.clerkId, currentCount + 1);
            return { unreadCounts: newUnreadCounts };
          });
          toast(`New message from ${sender.fullName || "a user"}!`);
        }
      }
    });

    socket.on("message_sent", (message: Message) => {
      set((state) => ({ messages: [...state.messages, message] }));
    });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
  },

  sendMessage: (receiverId, content) => {
    const { socket, currentUserDb } = get();
    if (!currentUserDb) return toast.error("User data not found.");
    if (!socket?.connected) return toast.error("Not connected to chat server.");

    socket.emit("send_message", {
      senderId: currentUserDb._id, // Mongo
      receiverId,                  // Mongo
      content,
    });
  },

  fetchMessages: async (clerkId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/users/messages/${clerkId}`);
      set({ messages: response.data });
      get().resetUnreadCount(clerkId);
    } catch (error: any) {
      set({ error: "Failed to fetch messages" });
      toast.error("Failed to fetch messages");
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFollow: async (targetUserClerkId: string) => {
    try {
      const response = await axiosInstance.post(`/users/toggle-follow/${targetUserClerkId}`);
      const { message, action } = response.data;
      toast.success(message);

      set((state) => ({
        users: state.users.map((u) =>
          u.clerkId === targetUserClerkId ? { ...u, isFollowing: action === "followed" } : u
        ),
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update follow status");
    }
  },
}));
