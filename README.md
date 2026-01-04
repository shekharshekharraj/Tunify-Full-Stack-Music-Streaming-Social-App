# **Tunify — Full-Stack Music Streaming & Social App**

**Tunify** is a feature-rich full-stack music platform that blends a seamless global player with a real-time social layer. Stream songs, sync party rooms, chat live, sing with LRC lyrics, and get AI-assisted recommendations. Now with a **YouTube Mini Player dock** and a **YouTube Music Explorer** for instant discovery.

🔗 **Live Demo:** [[www.tunify.co.in](http://www.tunify.co.in)]

---

## ✨ Key Highlights

* 🎵 **Global Persistent Player** — Play/pause, seek, skip, repeat (one/off), volume, keyboard shortcuts; works across the app.
* 🖼️ **Immersive Now Playing** — Full-screen player with dynamic ambient background (ColorThief), smooth dock, cursor-hide logic.
* 🎤 **Lyrics Sync (LRC)** — Auto-scrolling lyrics, active line highlight, mobile-friendly, quick ±sync nudges.
* 👥 **Party Room** — Real-time synced playback with Socket.IO + WebRTC (<100 ms latency), presence, emoji bursts, and chat.
* 🤖 **AI Chatbot (Gemini API)** — Conversational assistant for playlist curation, vibe mixes, and discovery prompts.
* ▶️ **YouTube Mini Player (Dock)** — Slide-in **right-side mini player** 
* 📰 **What’s New** — Live product updates with SSE; **demo fallback** (hardcoded updates) when backend isn’t available.
* 💬 **Social Layer** — Friends’ “Listening to…” feed, 1:1 chat with delivery + unread counts.
* 🛠️ **Admin Console** — Role-protected CRUD for songs/albums, Cloudinary uploads, live LRC editor.
* 📱 **Responsive UI** — Tailwind + shadcn/ui; polished micro-interactions and accessible controls.
* 🔐 **Security** — Clerk auth + RBAC, Helmet, rate limiting, and secure API design.

---

## 🧩 Feature Details

### Player & Lyrics

* Global `<audio id="global-audio">` keeps playback consistent across routes.
* Keyboard: **Space** (play/pause), **←/→** (seek ±5s), **↑/↓** (volume).
* Full-screen: ambient color wash, smart dock show/hide, cursor auto-hide.
* LRC parser supports `mm:ss.xx / mm:ss.xxx`; word/line highlighting.

### Discovery & Library

* Home sections: Featured, Trending, Made For You; time-based greetings.
* Clean album pages with consistent art/brand; independent scrolling for sidebars/content.

### YouTube Integrations

* **Mini Player Dock (Home only)**

  * Open via the player bar’s **device/TV icon** (top-right control cluster).
  * Draggable/scrollable panel with max-height confinement.
  * Uses **`https://www.youtube-nocookie.com/embed/{id}`** with `modestbranding=1`.
  * Compact **suggestion chips**; clicking a result swaps the iFrame video.
* **YouTube Music Explorer (`/yt`)**

  * Tunify logo + “YouTube Music Explorer” hero.
  * Tabs, gradient animations, skeletons, elegant results cards.
  * Modal iFrame player (plays inline; no page leave).

### Social / Live

* Presence + activity: “Playing X by Y”.
* Party Rooms: shared queue, live chat, reactions; leader/follower sync.
* Optional activity updates via Socket.IO events.

### What’s New

* `/whats-new` page hits API first; **falls back to embedded DEMO_UPDATES** if API is down.
* SSE endpoint (`/api/whats-new/stream`) for live inserts/edits when available.

### Admin

* `/api/admin/is-admin` check (Clerk ID / allowlist email).
* Cloudinary uploads, LRC editing, and stats.
* Seed script for **What’s New** with `x-seed-key` header; PowerShell cURL or Node seeder.

---

## 🛠 Tech Stack

| Category     | Tech                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| **Frontend** | React, TypeScript, Vite, Zustand (persist), Tailwind CSS, **shadcn/ui**, React Router, Axios |
| **Backend**  | Node.js, Express, MongoDB (Mongoose), Socket.IO, Helmet, Morgan, Rate Limiting               |
| **Auth**     | **Clerk** (Email + Google OAuth), RBAC                                                       |
| **Storage**  | **Cloudinary** (audio/artwork)                                                               |
| **AI**       | **Gemini API** (chatbot & recommendations)                                                   |
| **Media**    | **YouTube iFrame** (`youtube-nocookie`), optional **ytmusic-api** for search/suggestions     |
| **UX**       | ColorThief, LRC parser, SSE (EventSource)                                                    |

> **Note on `ytmusic-api`:** used client-side as a scraper for search/suggestions. Expect occasional rate limits/captcha variance in production; we proxy/trim as needed.

---

## 🚀 Deployment (Render)

* **Platform**: Render (single web service serving API + static frontend).
* **Build**: `npm run build` → backend serves `dist/`.
* **Start**: `npm start`.
* **Env Vars**

  * `MONGODB_URI` — MongoDB Atlas
  * `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` — Clerk
  * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  * `SEED_KEY` — for “What’s New” seeding
  * `BASE_URL` — (optional) for seed scripts (defaults to `http://localhost:5000`)
* **CSP & Embeds**
  Helmet is configured with a relaxed media/frame policy for YouTube:

  * Allow `frame-src https://www.youtube-nocookie.com https://www.youtube.com`.
  * If you enable strict CSPs, ensure `img-src` allows YouTube thumbnails and Cloudinary.
* **Autoplay**
  Mobile/desktop browsers may block autoplay without a user gesture. We play after click/tap and keep **`playsinline=1`** on the iFrame.

---

## 🔐 Security

* Helmet (CSP, no-sniff), rate-limited APIs, Clerk JWT verification.
* Socket.IO auth handshake validates Clerk identity (server side).
* Admin role checks via server; probes use `no-store`.

---

## 🧪 Developer Notes

* **YouTube Mini Player Dock**

  * Scrollable container with `max-h: calc(100vh - 120px)`; suggestion chips compact to avoid pushing results below the fold.
  * Use the **player bar TV icon** to toggle on Home.
* **What’s New**

  * Seeder: `node scripts/seed-whatsnew.mjs` (reads `backend/src/seeds/whatsnew.json` by default).
  * Fallback demo content is bundled in the frontend so the page never looks empty.
* **Playback**

  * Global `<audio>` is shared via Zustand; `resumeAudioContext` handles suspended contexts before play/seek/volume updates.

---

## 📸 Screenshots


<img width="1918" height="906" alt="Now Playing" src="https://github.com/user-attachments/assets/72d6abc7-4192-4e00-aac0-f107fdfc9f0a" />
<img width="1918" height="910" alt="Home & Feed" src="https://github.com/user-attachments/assets/cc08e2b7-7810-4e7c-a066-09df26868bcd" />

---

## 👤 Author

**Raj Shekhar** – Ai & Full-Stack Developer
🔗 [GitHub](https://github.com/shekharshekharraj) • [LinkedIn](https://www.linkedin.com/in/raj-shekhar~/)

---
