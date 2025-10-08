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
