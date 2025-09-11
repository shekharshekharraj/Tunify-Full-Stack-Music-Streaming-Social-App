import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: any;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	unreadCounts: Map<string, number>; // clerkId -> count

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	resetUnreadCount: (userId: string) => void;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false,
	withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: socket,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	unreadCounts: new Map(),

	setSelectedUser: (user) => {
		if (user) {
			get().resetUnreadCount(user.clerkId);
		}
		set({ selectedUser: user });
	},

	resetUnreadCount: (userId) => {
		set((state) => {
			const newCounts = new Map(state.unreadCounts);
			newCounts.set(userId, 0);
			return { unreadCounts: newCounts };
		});
	},

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId) => {
		if (!get().isConnected) {
			socket.auth = { userId };
			socket.connect();

			socket.emit("user_connected", userId);

			socket.on("users_online", (users: string[]) => set({ onlineUsers: new Set(users) }));
			socket.on("activities", (activities: [string, string][]) => set({ userActivities: new Map(activities) }));
			socket.on("user_connected", (userId: string) => set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })));

			socket.on("user_disconnected", (userId: string) => {
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(userId);
					return { onlineUsers: newOnlineUsers };
				});
			});

			// Unified listener for incoming messages
			socket.on("receive_message", (message: Message) => {
				// If the chat for the sender is currently open, append the message to the view
				if (get().selectedUser?.clerkId === message.senderId) {
					set((state) => ({ messages: [...state.messages, message] }));
				} else {
					// Otherwise, increment the unread count for that sender
					set((state) => {
						const newCounts = new Map(state.unreadCounts);
						const currentCount = newCounts.get(message.senderId) || 0;
						newCounts.set(message.senderId, currentCount + 1);
						return { unreadCounts: newCounts };
					});
				}
			});

			socket.on("message_sent", (message: Message) => set((state) => ({ messages: [...state.messages, message] })));

			socket.on("activity_updated", ({ userId, activity }) => {
				set((state) => {
					const newActivities = new Map(state.userActivities);
					newActivities.set(userId, activity);
					return { userActivities: newActivities };
				});
			});

			set({ isConnected: true });
		}
	},

	disconnectSocket: () => {
		if (get().isConnected) {
			socket.disconnect();
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content) => {
		get().socket?.emit("send_message", { receiverId, senderId, content });
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},
}));