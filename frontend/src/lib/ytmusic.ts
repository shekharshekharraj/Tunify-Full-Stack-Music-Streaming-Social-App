// src/lib/ytmusic.ts
import { axiosInstance } from "@/lib/axios";

export type YTResult = {
  id: string;
  videoId: string | null;
  title: string;
  artist: string;
  album: string;
  type: string;
  duration?: string | null;
  durationMs?: number | null;
  coverUrl?: string | null;
  thumbnails?: { url: string; width?: number; height?: number }[];
};

export async function ytSearchApi(q: string, type: string = "songs", limit = 20) {
  const { data } = await axiosInstance.get(`/yt/search`, {
    params: { q, type, limit },
  });
  return (data?.results || []) as YTResult[];
}

export async function ytSuggestApi(q: string) {
  const { data } = await axiosInstance.get(`/yt/suggest`, { params: { q } });
  return (data?.suggestions || []) as string[];
}

export async function ytLyricsApi(videoId: string) {
  const { data } = await axiosInstance.get(`/yt/lyrics`, { params: { id: videoId } });
  return data?.lyrics || null;
}

export async function ytEmbedUrl(videoId: string) {
  const { data } = await axiosInstance.get(`/yt/embed`, { params: { id: videoId } });
  return data?.url as string;
}
