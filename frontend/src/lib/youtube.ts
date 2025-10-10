// frontend/src/lib/youtube.ts
// Centralized YouTube helpers (FE only)

const preferNoCookie =
  (import.meta.env.VITE_YT_NOCOOKIE ?? "false").toLowerCase() === "true";

function getYouTubeHost() {
  // Many channels restrict embedding on youtube-nocookie in production.
  // Default to www.youtube.com for maximum compatibility.
  return preferNoCookie ? "www.youtube-nocookie.com" : "www.youtube.com";
}

export function buildYTUrl(videoId: string) {
  const host = getYouTubeHost();
  const base = `https://${host}/embed/${encodeURIComponent(videoId)}`;

  const params: Record<string, string> = {
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  };

  // Only attach origin if the app is served over HTTPS (Render/custom domain)
  try {
    const origin = window.location.origin;
    if (origin && origin.startsWith("https://")) {
      params.origin = origin;
    }
  } catch {}

  const qs = new URLSearchParams(params);
  return `${base}?${qs.toString()}`;
}

/* ---------------- IFrame API loader (singleton) ---------------- */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let YT_LOADING: Promise<typeof window.YT> | null = null;

/**
 * Loads the YouTube IFrame API exactly once.
 * NOTE: must always come from www.youtube.com (nocookie host doesn't serve the API).
 */
export function loadYouTubeAPI() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!YT_LOADING) {
    YT_LOADING = new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    });
  }
  return YT_LOADING;
}

/* ---------------- Player helpers ---------------- */

export const buildPlayerVars = (origin: string) => ({
  autoplay: 0,
  rel: 0,
  modestbranding: 1,
  playsinline: 1,
  enablejsapi: 1,
  origin,
});

export const isValidVideoId = (id?: string | null) =>
  typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);

/** Robustly extract the 11-char video ID from various inputs */
export function extractVideoId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Bare ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Watch URL
  const mWatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (mWatch) return mWatch[1];

  // Short youtu.be URL
  const mShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (mShort) return mShort[1];

  // Embed URL
  const mEmbed = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (mEmbed) return mEmbed[1];

  // Last resort: any 11-char token
  const mGeneral = trimmed.match(/[a-zA-Z0-9_-]{11}/);
  if (mGeneral) return mGeneral[0];

  return null;
}

/** Picks the best candidate field and sanitizes it */
export function pickAndSanitizeId(r: any): string | null {
  const candidates = [r?.videoId, r?.id, r?.url, r?.video?.videoId].filter(Boolean) as string[];
  for (const c of candidates) {
    const id = extractVideoId(c);
    if (isValidVideoId(id)) return id!;
  }
  return null;
}

/* ---------------- HD Thumbnail helpers ---------------- */

/** Build the known best-order thumbnail candidates for a videoId. */
export function buildYTThumbCandidates(videoId: string): string[] {
  const base = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}`;
  // Order matters — some videos don't have maxres
  return [
    `${base}/maxresdefault.jpg`, // ~1280x720+
    `${base}/sddefault.jpg`,     // 640x480
    `${base}/hqdefault.jpg`,     // 480x360
    `${base}/mqdefault.jpg`,     // 320x180
  ];
}

function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve((img.naturalWidth ?? 0) > 1);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Small in-memory cache to avoid re-probing thumbnails we already found
const bestThumbCache = new Map<string, string>();

/**
 * Returns the best available (highest-res) YouTube thumbnail URL for a given videoId.
 * Tries maxres -> sd -> hq -> mq and resolves with the first that loads.
 */
export async function getBestYouTubeThumb(videoId: string): Promise<string | null> {
  if (!isValidVideoId(videoId)) return null;
  const cached = bestThumbCache.get(videoId);
  if (cached) return cached;

  const candidates = buildYTThumbCandidates(videoId);
  for (const url of candidates) {
    // Attempt to load the image; if it exists, stop and cache
    // (i.ytimg.com serves 200 for some "missing" maxres with tiny 120x90; guard by naturalWidth)
    const ok = await preloadImage(url);
    if (ok) {
      bestThumbCache.set(videoId, url);
      return url;
    }
  }
  return null;
}
