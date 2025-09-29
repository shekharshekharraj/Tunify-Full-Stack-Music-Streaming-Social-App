# Tunify — Full‑Stack Music Streaming & Social App

A feature‑rich, full‑stack music streaming application inspired by modern platforms. **Tunify** pairs a seamless, immersive audio player with a real‑time social layer—listen to music, see what friends are playing, view synchronized lyrics, and chat one‑on‑one. Includes a role‑protected **Admin Console** for catalog management.

**Live Demo:** (https://tunify-full-stack-music-streaming-social.onrender.com)

---

## ✨ Highlights

* **Global audio player** (persistent) with play/pause, next/prev, seek, volume
* **Repeat modes**: off / one (toggleable)
* **Full‑screen “Now Playing”** with dynamic background (dominant color from artwork) and visualizer
* **Synced lyrics overlay (LRC)** with auto‑scroll and active line highlight
* **Real‑time social layer**: friends’ online status + “Listening to …” activity
* **1:1 chat** with live delivery and unread counts
* **Feed** (shows followed users’ activities)
* **Search** across title & artist
* **Admin console**: songs/albums CRUD, Cloudinary upload, lyrics editing
* **Responsive UI**: Tailwind CSS + shadcn/ui
* **Auth**: Clerk with admin checks (email or Clerk user id)

---

## 🧩 Feature Details

### Player & Lyrics

* Single global `<audio id="global-audio">` used app‑wide for perfect sync
* Repeat one/off; keyboard shortcuts; mobile‑friendly controls
* Full‑screen player with ambient color from artwork + equalizer/visualizer
* Lyrics panel with fixed header, smooth auto‑center, mm:ss.xx / mm:ss.xxx parser

### Discovery & Library

* Time‑based greeting (Good morning/afternoon/evening)
* Sections: Featured, Trending, Made For You
* Independent scrolling for sidebar/content to avoid overlap with player
* Topbar logo/wordmark; album page branding kept clean

### Social

* Friends Activity: online status + current track
* Hover tooltips for full “Listening to …” strings
* Direct messages with real‑time delivery via Socket.IO

### Admin

* Secure probe: `GET /api/admin/is-admin` (no‑cache; varies by Authorization)
* Admin allowed by **either** email (`ADMIN_EMAIL`) **or** Clerk user id (`ADMIN_CLERK_ID`)
* Dashboard: upload songs/albums (Cloudinary), edit LRC lyrics, basic stats

---

## 🛠 Tech Stack

| Category | Tech                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Zustand, Tailwind, shadcn/ui, React Router, Axios    |
| Backend  | Node.js, Express, MongoDB, Mongoose, Socket.IO, Helmet, Morgan, Rate limiting |
| Auth     | Clerk (incl. Google OAuth)                                                    |
| Storage  | Cloudinary                                                                    |
| Other    | ColorThief (dominant color), LRC parsing                                      |

---

## 🗂 Project Structure (high level)

```
/frontend
  src/
    components/          # Topbar, Player, Lyrics, UI building blocks
    layout/              # Main layout + Player shell
    pages/               # Home, Chat, Admin, Album, etc.
    stores/              # Zustand stores (player, music, chat, auth)
    lib/axios.ts         # Axios instance with Clerk token interceptor

/backend
  src/
    controller/          # admin, user, auth, activity, edit
    routes/              # admin, users, songs, albums, stats, activity
    middleware/          # protectRoute, requireAdmin
    lib/                 # db, socket, cloudinary
    models/              # Song, Album, User
    index.js             # App bootstrap
```

---

## 🚀 Getting Started (Local)

### Prerequisites

* Node.js **18+**
* npm
* Accounts: **MongoDB Atlas**, **Clerk**, **Cloudinary**

### 1) Clone

```bash
git clone https://github.com/shekharshekharraj/Tunify-Full-Stack-Music-Streaming-Social-App.git
cd Tunify-Full-Stack-Music-Streaming-Social-App
```

### 2) Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI="your_mongodb_connection_string"

# Admin can be matched by EMAIL or by CLERK ID (either is fine)
ADMIN_EMAIL="your_admin_email@example.com"
ADMIN_CLERK_ID="optional_clerk_user_id"

# Clerk (server)
CLERK_SECRET_KEY="your_clerk_secret_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Optional but recommended for CORS clarity
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"

NODE_ENV=development
```

> **Admin rule**: Set **either** `ADMIN_EMAIL` (matches your login email) **or** `ADMIN_CLERK_ID` (exact Clerk user ID). The probe `GET /api/admin/is-admin` is `no-store` and `Vary: Authorization` so role switches reflect immediately.

### 3) Frontend setup (from project root)

```bash
npm install
```

Create `./.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
VITE_BACKEND_API_URL="http://localhost:5000"
```

> If you used `FRONTEND_URL/BACKEND_URL` on the server, keep these aligned.

### 4) Seed data (optional)

```bash
# from /backend
npm run seed:albums
# (add additional seed scripts as needed e.g. songs)
```

### 5) Run

**Backend**

```bash
# from /backend
npm run dev
```

**Frontend**

```bash
# from project root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploying on Render (single Web Service)

**Build Command**

* Option A (root script): `npm run build`
  (Installs deps for both apps, builds frontend)
* Option B (custom): create `render-build.sh` to `npm ci` + `vite build` frontend, then `npm ci` backend

**Start Command**

* `npm start` (root runs backend’s `node src/index.js`)

**Health Check Path**

* `/api/health`

**Environment (Render)**

* `NODE_ENV=production`
* **Do not set `PORT`** (Render injects it)
* Secrets: `MONGODB_URI`, `CLERK_SECRET_KEY`, `CLOUDINARY_*`
* Optional: `FRONTEND_URL` (only needed if serving frontend from a different origin)

**Static serving**

* Frontend is built to `frontend/dist` and served by Express in production
* Hashed assets: `Cache-Control: public, max-age=31536000, immutable`
* `index.html`: short cache / revalidation

---

## 🔐 Security & Hardening

* Helmet (CSP relaxed for audio/Cloudinary)
* Rate limiting on `/api`
* Socket.IO auth (Clerk token on connect) + CORS alignment
* Admin middleware: `protectRoute` + `requireAdmin`

---

## 🐞 Troubleshooting

**Admin button missing**

* Verify `ADMIN_EMAIL`/`ADMIN_CLERK_ID`
* Network tab → `GET /api/admin/is-admin` → expect `{ isAdmin: true }`
* Ensure Authorization header is present (Axios interceptor)

**Lyrics overlay title looks dim/hidden**

* Ensure you’re on latest `LyricsView` (fixed header + higher z-index)

**Tailwind unknown at‑rules warnings**

* VS Code → `.vscode/settings.json`:

```json
{ "css.lint.unknownAtRules": "ignore", "scss.lint.unknownAtRules": "ignore", "less.lint.unknownAtRules": "ignore" }
```

---

## 🧪 Scripts

**Backend**

* `npm run dev` – start dev server (nodemon)
* `npm run seed:albums` – seed example albums (add more as needed)

**Frontend**

* `npm run dev` – Vite dev server
* `npm run build` – production build
* `npm run preview` – serve built app locally

---

## 📄 License

MIT — feel free to use, modify, and learn.

## 👤 Author

**Raj Shekhar**
