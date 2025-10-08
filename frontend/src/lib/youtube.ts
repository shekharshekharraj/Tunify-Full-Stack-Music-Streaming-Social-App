// frontend/src/lib/youtube.ts
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
