// backend/src/services/ai.memory.service.js
// Simple in-memory per-user memory. Swap to Mongo later if needed.

const store = new Map();
/*
 shape:
 {
   history: [{role:"user"|"assistant", text:string, t:number}] (trimmed),
   lastResolvedSong: { _id, title, artist, imageUrl, audioUrl } | null
 }
*/

const MAX_HISTORY = 12;

export function getUserMem(userId = "anonymous") {
  if (!store.has(userId)) {
    store.set(userId, { history: [], lastResolvedSong: null });
  }
  return store.get(userId);
}

export function appendHistory(userId, role, text) {
  const mem = getUserMem(userId);
  mem.history.push({ role, text, t: Date.now() });
  if (mem.history.length > MAX_HISTORY) mem.history = mem.history.slice(-MAX_HISTORY);
}

export function setLastResolvedSong(userId, song) {
  const mem = getUserMem(userId);
  mem.lastResolvedSong = song ? { ...song } : null;
}

export function getLastResolvedSong(userId) {
  return getUserMem(userId).lastResolvedSong;
}

export function clearUserMem(userId) {
  store.delete(userId);
}
