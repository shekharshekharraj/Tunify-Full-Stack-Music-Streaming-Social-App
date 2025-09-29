// backend/src/services/ai.action-dispatcher.js
import {Song} from "../models/song.model.js"; // default import
import { getLastResolvedSong, setLastResolvedSong } from "./ai.memory.service.js";

function tokenize(q) {
  return String(q || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
}
function toMMSS(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec || 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function relPronounQueryIfAny(q, last) {
  const lq = String(q || "").trim().toLowerCase();
  if (!last) return null;
  if (/^(that|this|it)$/i.test(lq)) return last.title || `${last.title || ""} ${last.artist || ""}`.trim();
  if (/^(play|queue)\s+(that|this|it)$/i.test(lq)) return last.title || `${last.title || ""} ${last.artist || ""}`.trim();
  return null;
}

async function resolveSongByQuery(userId, query) {
  // NEW: if no query, try last resolved song from memory
  if (!query) {
    const last = getLastResolvedSong(userId);
    return last || null;
  }

  const last = getLastResolvedSong(userId);
  const rel = relPronounQueryIfAny(query, last);
  const raw = String(rel || query).trim();

  // 1) Simple i-regex on title/artist
  let hit = await Song.findOne({
    $or: [{ title: { $regex: raw, $options: "i" } }, { artist: { $regex: raw, $options: "i" } }],
  }).lean();

  // 2) Token AND match across title+artist
  if (!hit) {
    const tokens = tokenize(raw).map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    hit = await Song.findOne({
      $and: tokens.map((rx) => ({ $or: [{ title: rx }, { artist: rx }] })),
    }).lean();
  }

  // 3) Optional text index fallback
  if (!hit) {
    try {
      hit = await Song.findOne({ $text: { $search: raw } }, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .lean();
    } catch {}
  }

  if (!hit) return null;

  const song = {
    _id: String(hit._id),
    title: hit.title,
    artist: hit.artist || "",
    imageUrl: hit.imageUrl || "",
    audioUrl: hit.audioUrl || "",
    duration: hit.duration || undefined,
    likesCount: Array.isArray(hit.likes) ? hit.likes.length : 0,
    createdAt: hit.createdAt || null,
    updatedAt: hit.updatedAt || null,
    albumId: hit.albumId || null,
    lyrics: hit.lyrics || "",
  };

  setLastResolvedSong(userId, song);
  return song;
}

async function listOtherByArtist(artist, excludeId) {
  if (!artist) return [];
  const others = await Song.find({ artist, _id: { $ne: excludeId } }).sort({ createdAt: -1 }).limit(5).lean();
  return others.map((s) => ({
    _id: String(s._id),
    title: s.title,
    duration: s.duration || undefined,
    audioUrl: s.audioUrl || "",
    imageUrl: s.imageUrl || "",
  }));
}

async function buildSongInfo(userId, query) {
  const song = await resolveSongByQuery(userId, query);
  if (!song) return null;

  const details = {
    title: song.title,
    artist: song.artist,
    duration: typeof song.duration === "number" ? toMMSS(song.duration) : undefined,
    albumId: song.albumId ? String(song.albumId) : undefined,
    likes: song.likesCount,
    added: song.createdAt ? new Date(song.createdAt).toISOString() : undefined,
    updated: song.updatedAt ? new Date(song.updatedAt).toISOString() : undefined,
    imageUrl: song.imageUrl || undefined,
    audioUrl: song.audioUrl || undefined,
  };
  const alsoByArtist = await listOtherByArtist(song.artist, song._id);
  return { song, details, alsoByArtist };
}

async function buildArtistInfo(artistName, fallbackQuery) {
  const artist = artistName || fallbackQuery || "";
  if (!artist.trim()) return null;

  const songs = await Song.find({ artist: { $regex: artist, $options: "i" } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  if (!songs.length) return null;

  const total = await Song.countDocuments({ artist: { $regex: artist, $options: "i" } });
  const top = songs.slice(0, 5).map((s) => ({
    _id: String(s._id),
    title: s.title,
    duration: typeof s.duration === "number" ? toMMSS(s.duration) : undefined,
    audioUrl: s.audioUrl || "",
    imageUrl: s.imageUrl || "",
  }));

  return {
    artist: songs[0].artist || artistName,
    catalogCount: total,
    sampleTracks: top,
    latestAdded: songs[0].createdAt ? new Date(songs[0].createdAt).toISOString() : undefined,
  };
}

function excerptLyrics(full, maxChars = 280) {
  const s = String(full || "").trim();
  if (!s) return null;
  const clean = s.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, "").trim(); // strip [00:00.000]
  return clean.length > maxChars ? `${clean.slice(0, maxChars)}…` : clean;
}

export async function dispatchAiAction({ userId, action }) {
  switch (action?.type) {
    // Playback & queue
    case "play_song": {
      const song = await resolveSongByQuery(userId, action.query);
      if (!song || !song.audioUrl) return { serverEffect: "not_found", note: `Song not found: ${action?.query}` };
      return { serverEffect: "none", clientInstruction: { type: "play_song", payload: song } };
    }
    case "queue_song": {
      const song = await resolveSongByQuery(userId, action.query);
      if (!song || !song.audioUrl) return { serverEffect: "not_found", note: `Song not found: ${action?.query}` };
      return { serverEffect: "queued", clientInstruction: { type: "queue_song", payload: song } };
    }
    case "pause": return { clientInstruction: { type: "pause" } };
    case "resume": return { clientInstruction: { type: "resume" } };
    case "play_next": return { clientInstruction: { type: "play_next" } };
    case "play_previous": return { clientInstruction: { type: "play_previous" } };
    case "whats_playing": return { clientInstruction: { type: "whats_playing" } };

    // Toggles
    case "toggle_lyrics":
      return { clientInstruction: { type: "toggle_lyrics", payload: { on: action.on } } };
    case "set_volume":
      return { clientInstruction: { type: "set_volume", payload: { value: action.value } } };
    case "set_repeat":
      return { clientInstruction: { type: "set_repeat", payload: { mode: action.mode } } };

    // Discovery / playlists
    case "recommend_songs": {
      const recs = []; // stub or populate from DB
      return { serverEffect: "recommended", recs };
    }
    case "create_playlist": {
      const playlist = { id: "pl_" + Math.random().toString(36).slice(2, 8), name: action.theme || "New Mix" };
      return { serverEffect: "created_playlist", playlist };
    }
    case "add_to_playlist":
      return { serverEffect: "added_to_playlist", added: { playlistName: action.playlistName, query: action.query } };

    // Info actions (✅ produce rich assistantOverride)
    case "song_info": {
      const info = await buildSongInfo(userId, action.query);
      if (!info) return { note: "song_info_not_found" };
      const bullets = [
        `**Title:** ${info.details.title}`,
        `**Artist:** ${info.details.artist}`,
        info.details.duration ? `**Duration:** ${info.details.duration}` : null,
        typeof info.details.likes === "number" ? `**Likes:** ${info.details.likes}` : null,
        info.details.added ? `**Added:** ${new Date(info.details.added).toLocaleString()}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const also = info.alsoByArtist.length
        ? "\n\n**More by this artist:**\n" +
          info.alsoByArtist.map((s) => `- ${s.title}${s.duration ? ` (${toMMSS(s.duration)})` : ""}`).join("\n")
        : "";
      return { songInfo: info, assistantOverride: `${bullets}${also}` };
    }

    case "artist_info": {
      const name = action.artist || "";
      const info = await buildArtistInfo(name, action.query);
      if (!info) return { note: "artist_info_not_found" };
      const lines = [
        `**Artist:** ${info.artist}`,
        `**Songs in your library:** ${info.catalogCount}`,
        info.latestAdded ? `**Latest added:** ${new Date(info.latestAdded).toLocaleString()}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const sample = info.sampleTracks.length
        ? "\n\n**Popular in your library:**\n" +
          info.sampleTracks.map((s) => `- ${s.title}${s.duration ? ` (${s.duration})` : ""}`).join("\n")
        : "";
      return { artistInfo: info, assistantOverride: `${lines}${sample}` };
    }

    case "lyrics_snippet": {
      const song = await resolveSongByQuery(userId, action.query);
      if (!song) return { note: "lyrics_song_not_found" };
      const snippet = excerptLyrics(song.lyrics || "");
      if (!snippet) return { note: "lyrics_not_available" };
      return { lyrics: snippet, assistantOverride: `**Lyrics (excerpt):**\n${snippet}` };
    }

    case "artist_fact":
      return { fact: `Fun fact about ${action.artist || "this artist"}: legendary live shows!` };

    default:
      return { note: "no-op" };
  }
}
