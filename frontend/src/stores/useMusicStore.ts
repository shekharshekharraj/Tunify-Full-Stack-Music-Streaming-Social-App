// src/stores/useMusicStore.ts
import { axiosInstance } from "@/lib/axios";
import { Album, Song, Stats, Comment, PaginatedComments } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";

interface MusicStore {
  songs: Song[];
  albums: Album[];
  isLoading: boolean;
  error: string | null;
  currentAlbum: Album | null;
  featuredSongs: Song[];
  madeForYouSongs: Song[];
  trendingSongs: Song[];
  stats: Stats;

  // Comments cache + meta (by song)
  commentsBySong: Record<string, Comment[]>;
  commentsMetaBySong: Record<string, { page: number; limit: number; total: number } | undefined>;
  commentsLoading: boolean;

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  fetchFeaturedSongs: () => Promise<void>;
  fetchMadeForYouSongs: () => Promise<void>;
  fetchTrendingSongs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSongs: () => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  updateSong: (id: string, data: { title: string; artist: string; duration: number; lyrics?: string }) => Promise<void>;
  updateAlbum: (id: string, data: { title: string; artist: string; releaseYear: number }) => Promise<void>;

  // Likes & comments
  toggleLike: (songId: string) => Promise<void>;
  /**
   * Fetch comments for a song. If the API supports pagination, pass page/limit.
   * Remains compatible with non-paginated responses.
   */
  fetchComments: (songId: string, opts?: { page?: number; limit?: number; mode?: "replace" | "append" }) => Promise<void>;
  addComment: (songId: string, text: string) => Promise<void>;
  deleteComment: (songId: string, commentId: string) => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set) => ({
  songs: [],
  albums: [],
  isLoading: false,
  error: null,
  currentAlbum: null,
  madeForYouSongs: [],
  featuredSongs: [],
  trendingSongs: [],
  stats: {
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalArtists: 0,
  },

  commentsBySong: {},
  commentsMetaBySong: {},
  commentsLoading: false,

  updateSong: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await axiosInstance.put(`/admin/songs/${id}`, data);
      set((state) => ({
        songs: state.songs.map((s) => (s._id === id ? { ...s, ...updated } : s)),
        featuredSongs: state.featuredSongs.map((s) => (s._id === id ? { ...s, ...updated } : s)),
        madeForYouSongs: state.madeForYouSongs.map((s) => (s._id === id ? { ...s, ...updated } : s)),
        trendingSongs: state.trendingSongs.map((s) => (s._id === id ? { ...s, ...updated } : s)),
        currentAlbum: state.currentAlbum
          ? {
              ...state.currentAlbum,
              songs: state.currentAlbum.songs.map((s) => (s._id === id ? { ...s, ...updated } : s)),
            }
          : state.currentAlbum,
      }));
      toast.success("Song updated successfully");
    } catch (error: any) {
      toast.error("Failed to update song: " + (error?.message ?? "Unknown error"));
    } finally {
      set({ isLoading: false });
    }
  },

  updateAlbum: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await axiosInstance.put(`/admin/albums/${id}`, data);
      set((state) => ({
        albums: state.albums.map((a) => (a._id === id ? updated : a)),
        currentAlbum: state.currentAlbum && state.currentAlbum._id === id ? updated : state.currentAlbum,
      }));
      toast.success("Album updated successfully");
    } catch (error: any) {
      toast.error("Failed to update album: " + (error?.message ?? "Unknown error"));
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSong: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/songs/${id}`);
      set((state) => ({
        songs: state.songs.filter((s) => s._id !== id),
        featuredSongs: state.featuredSongs.filter((s) => s._id !== id),
        madeForYouSongs: state.madeForYouSongs.filter((s) => s._id !== id),
        trendingSongs: state.trendingSongs.filter((s) => s._id !== id),
        currentAlbum: state.currentAlbum
          ? { ...state.currentAlbum, songs: state.currentAlbum.songs.filter((s) => s._id !== id) }
          : state.currentAlbum,
      }));
      toast.success("Song deleted successfully");
    } catch (error: any) {
      toast.error("Error deleting song");
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAlbum: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/albums/${id}`);
      set((state) => ({
        albums: state.albums.filter((a) => a._id !== id),
        songs: state.songs.map((s) => (s.albumId === id ? { ...s, albumId: null } : s)),
        currentAlbum: state.currentAlbum && state.currentAlbum._id === id ? null : state.currentAlbum,
      }));
      toast.success("Album deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete album: " + (error?.message ?? "Unknown error"));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/songs");
      set({ songs: data });
    } catch (error: any) {
      set({ error: error?.message ?? "Failed to load songs" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/stats");
      set({ stats: data });
    } catch (error: any) {
      set({ error: error?.message ?? "Failed to load stats" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/albums");
      set({ albums: data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? error?.message ?? "Failed to load albums" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlbumById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get(`/albums/${id}`);
      set({ currentAlbum: data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? error?.message ?? "Failed to load album" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeaturedSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/songs/featured");
      set({ featuredSongs: data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? error?.message ?? "Failed to load featured songs" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMadeForYouSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/songs/made-for-you");
      set({ madeForYouSongs: data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? error?.message ?? "Failed to load made-for-you songs" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTrendingSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/songs/trending");
      set({ trendingSongs: data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? error?.message ?? "Failed to load trending songs" });
    } finally {
      set({ isLoading: false });
    }
  },

  // ----- Likes & Comments -----
  toggleLike: async (songId) => {
    try {
      const { data } = await axiosInstance.post(`/songs/${songId}/like`);
      const apply = (list: Song[]) => list.map((s) => (s._id === songId ? { ...s, likes: data.likes } : s));
      set((state) => ({
        songs: apply(state.songs),
        featuredSongs: apply(state.featuredSongs),
        madeForYouSongs: apply(state.madeForYouSongs),
        trendingSongs: apply(state.trendingSongs),
        currentAlbum: state.currentAlbum
          ? { ...state.currentAlbum, songs: apply(state.currentAlbum.songs) }
          : state.currentAlbum,
      }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to like");
    }
  },

  fetchComments: async (songId, opts) => {
    set({ commentsLoading: true });
    const { page = 1, limit = 50, mode = "replace" } = opts || {};
    try {
      const { data } = await axiosInstance.get(`/songs/${songId}/comments`, {
        params: { page, limit },
      });

      // Backward compatible: accept either {comments} or full {comments, page, limit, total}
      const payload = (data as PaginatedComments) || { comments: data?.comments || data };
      const comments = Array.isArray(payload.comments) ? payload.comments : [];
      const meta = {
        page: (payload as PaginatedComments).page ?? page,
        limit: (payload as PaginatedComments).limit ?? limit,
        total: (payload as PaginatedComments).total ?? comments.length,
      };

      set((state) => {
        const prev = state.commentsBySong[songId] || [];
        const merged =
          mode === "append" ? [...prev, ...comments] : comments;

        return {
          commentsBySong: { ...state.commentsBySong, [songId]: merged },
          commentsMetaBySong: { ...state.commentsMetaBySong, [songId]: meta },
        };
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load comments");
    } finally {
      set({ commentsLoading: false });
    }
  },

  addComment: async (songId, text) => {
    if (!text.trim()) return;
    try {
      const { data } = await axiosInstance.post(`/songs/${songId}/comments`, { text });
      set((state) => {
        const prev = state.commentsBySong[songId] || [];
        return {
          commentsBySong: { ...state.commentsBySong, [songId]: [data.comment, ...prev] },
          // Optionally bump total if you use it
          commentsMetaBySong: {
            ...state.commentsMetaBySong,
            [songId]: state.commentsMetaBySong[songId]
              ? {
                  ...state.commentsMetaBySong[songId]!,
                  total: (state.commentsMetaBySong[songId]!.total ?? prev.length) + 1,
                }
              : state.commentsMetaBySong[songId],
          },
        };
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to comment");
    }
  },

  deleteComment: async (songId, commentId) => {
    try {
      await axiosInstance.delete(`/songs/${songId}/comments/${commentId}`);
      set((state) => {
        const prev = state.commentsBySong[songId] || [];
        const next = prev.filter((c) => c._id !== commentId);
        return {
          commentsBySong: { ...state.commentsBySong, [songId]: next },
          commentsMetaBySong: {
            ...state.commentsMetaBySong,
            [songId]: state.commentsMetaBySong[songId]
              ? {
                  ...state.commentsMetaBySong[songId]!,
                  total: Math.max(0, (state.commentsMetaBySong[songId]!.total ?? prev.length) - 1),
                }
              : state.commentsMetaBySong[songId],
          },
        };
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete comment");
    }
  },
}));
