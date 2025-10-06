// backend/src/services/ytmusic.service.js
// npm i ytmusic-api
import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();

// Simple in-memory TTL cache (Map + timeouts)
const cache = new Map();
function setCache(key, data, ttlMs = 60_000) {
  const t = setTimeout(() => cache.delete(key), ttlMs);
  cache.set(key, { data, t });
}
function getCache(key) {
  const hit = cache.get(key);
  return hit ? hit.data : null;
}

let initialized = false;

export async function initYTMusic(cookies) {
  if (initialized) return;
  try {
    await ytmusic.initialize(cookies || undefined);
    initialized = true;
    console.log("[YTMusic] initialized");
  } catch (e) {
    console.warn("[YTMusic] init failed (API may still work without cookies):", e.message);
    // Keep going—many endpoints still work w/o cookies.
    initialized = true;
  }
}

function chooseThumb(thumbnails) {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return null;
  const best = thumbnails.reduce((a, b) => (b?.width > a?.width ? b : a), thumbnails[0]);
  return best?.url || thumbnails[0]?.url || null;
}

function parseDurationToMs(dur) {
  // dur may be "3:42" or "1:02:30"
  if (!dur || typeof dur !== "string") return null;
  const parts = dur.split(":").map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
  if (parts.length === 2) {
    const [m, s] = parts;
    return (m * 60 + s) * 1000;
  } else if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h * 3600 + m * 60 + s) * 1000;
  }
  return null;
}

export async function ytSearch({ q, type = "songs", limit = 20 }) {
  await initYTMusic(process.env.YTMUSIC_COOKIES);
  const key = `search:${type}:${q}:${limit}`;
  const hit = getCache(key);
  if (hit) return hit;

  // type can be: "songs" | "videos" | "albums" | "artists" | "playlists"
  const res = await ytmusic.search(q, type);
  let items = Array.isArray(res) ? res : [];

  // Normalize a common shape for the FE
  const normalized = items.slice(0, limit).map((it) => ({
    id: it.videoId || it.browseId || it.playlistId || it.channelId || it.albumId || it.artistId || it.resultId,
    videoId: it.videoId || null,
    title: it.title || it.name || "",
    artist:
      (Array.isArray(it.artists) && it.artists.map((a) => a.name).join(", ")) ||
      it.artist?.name ||
      it.artist ||
      "",
    album: it.album?.name || it.album || "",
    type: it.type || type,
    duration: it.duration || null,
    durationMs: parseDurationToMs(it.duration),
    coverUrl: chooseThumb(it.thumbnails || it.thumbnail || []),
    thumbnails: it.thumbnails || [],
  }));

  setCache(key, normalized, 30_000);
  return normalized;
}

export async function ytSuggestions(q) {
  await initYTMusic(process.env.YTMUSIC_COOKIES);
  const key = `suggest:${q}`;
  const hit = getCache(key);
  if (hit) return hit;

  const res = await ytmusic.getSearchSuggestions(q);
  const suggestions = Array.isArray(res) ? res : [];
  setCache(key, suggestions, 60_000);
  return suggestions;
}

export async function ytLyrics(videoId) {
  await initYTMusic(process.env.YTMUSIC_COOKIES);
  if (!videoId) return null;
  const key = `lyrics:${videoId}`;
  const hit = getCache(key);
  if (hit) return hit;

  try {
    const lyr = await ytmusic.getLyrics(videoId);
    setCache(key, lyr || null, 5 * 60_000);
    return lyr || null;
  } catch (e) {
    return null;
  }
}
