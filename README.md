# **Tunify — Full-Stack Music Streaming & Social App**

**Built Tunify, a feature-rich full-stack music streaming platform that blends a seamless audio player with a real-time social layer.** Users can stream songs, enjoy synchronized party rooms, chat in real time, view LRC-synced lyrics, and interact with an AI chatbot powered by Gemini for smart music recommendations.

🔗 **Live Demo:** [www.tunify.co.in]

---

## ✨ **Key Highlights**

* 🎵 **Global Persistent Player** – Play/pause, seek, skip, repeat (one/off), volume control; works across all pages.
* 🎤 **Lyrics Sync** – LRC overlay with auto-scroll, active line highlighting, and mobile-friendly view.
* 🎨 **Immersive Now Playing** – Full-screen mode with dynamic ambient background (via ColorThief) and equalizer/visualizer.
* 👥 **Party Room** – Real-time synced playback with Socket.IO + WebRTC (<100ms latency), presence tracking, emoji reactions, and live chat.
* 🤖 **AI Chatbot (Gemini API)** – Smart conversational assistant for playlist curation, song discovery, and mood-based recommendations.
* 💬 **Social Features** – Friends’ activity feed (“Listening to…”) + 1:1 chat with live delivery, unread counts, and online status.
* 🛠️ **Admin Console** – Role-protected dashboard for CRUD on songs/albums, Cloudinary uploads, and live lyrics editing.
* 📱 **Responsive UI** – Modern design with **Tailwind CSS** + **shadcn/ui**, optimized for desktop and mobile.
* 🔐 **Authentication & Security** – Clerk auth with role-based access, admin checks, Helmet, rate limiting, and secure API endpoints.

---

<img width="1918" height="906" alt="image" src="https://github.com/user-attachments/assets/72d6abc7-4192-4e00-aac0-f107fdfc9f0a" />
<img width="1918" height="910" alt="image" src="https://github.com/user-attachments/assets/cc08e2b7-7810-4e7c-a066-09df26868bcd" />

## 🧩 **Feature Details**

### 🎶 Player & Lyrics

* Global `<audio id="global-audio">` for consistent sync across pages.
* Keyboard shortcuts for quick controls.
* Full-screen player with ambient blur + dominant color tint.
* Smooth auto-scroll LRC lyrics with mm:ss.xx / mm:ss.xxx parser.

### 🌍 Discovery & Library

* Time-based greetings (Good Morning/Afternoon/Evening).
* Sections: Featured, Trending, Made For You.
* Clean album pages with branding.
* Independent scrolling for sidebar & content (avoids overlap with persistent player).

### 🫂 Social Layer

* Real-time presence: friends’ online/offline & current track status.
* 1:1 chat via Socket.IO with live delivery and unread counts.
* Hover tooltips for full activity details.
* Party Room: synced playback, chat, video/audio calls, and reactions (concert-like shared experience).

### 🛡️ Admin Dashboard

* Secure endpoint `/api/admin/is-admin` (role checked via Clerk ID or Admin Email).
* Upload songs/albums to **Cloudinary**, edit lyrics (LRC), and view stats.
* Middleware: `protectRoute` + `requireAdmin` for strict access control.

---

## 🛠 **Tech Stack**

| Category     | Tech                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| **Frontend** | React, TypeScript, Vite, Zustand, Tailwind CSS, shadcn/ui, React Router, Axios |
| **Backend**  | Node.js, Express, MongoDB (Mongoose), Socket.IO, Helmet, Morgan, Rate limiting |
| **Auth**     | Clerk (Email + Google OAuth) with RBAC                                         |
| **Storage**  | Cloudinary for audio + artwork                                                 |
| **AI**       | Gemini API (chatbot for discovery & recommendations)                           |
| **Other**    | ColorThief (dominant color extraction), LRC parsing                            |

---

## 🚀 **Deployment**

* **Platform**: Render (single web service)
* **Build**: `npm run build` (frontend + backend)
* **Start**: `npm start` (backend bootstraps, serves frontend from `dist`)
* **Environment**:

  * `MONGODB_URI` → MongoDB Atlas
  * `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` → Clerk Auth
  * `CLOUDINARY_*` → Cloudinary credentials
* **Static Assets**: Served via Express with `Cache-Control` headers for optimized caching.

---

## 🔐 **Security**

* **Helmet** for headers & relaxed CSP for media.
* **Rate limiting** for APIs.
* **Socket.IO auth** (Clerk token validation).
* **No-store probes** for admin role verification.

---

## 👤 **Author**

**Raj Shekhar** – Full-Stack Developer
🔗 [GitHub](https://github.com/shekharshekharraj) | [LinkedIn](https://www.linkedin.com/in/raj-shekhar~/)


Would you like me to now **shorten this into a compact README version** (like the GitHub one) while keeping this longer version for LinkedIn/Portfolio?
