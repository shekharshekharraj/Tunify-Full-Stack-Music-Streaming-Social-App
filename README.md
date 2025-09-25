# Tunify · Full-Stack Music Streaming + Real-Time Social

A feature-rich, full-stack music streaming application inspired by modern music platforms. Tunify pairs a seamless, immersive audio player with a real-time social layer—listen to music, see what friends are playing, view synchronized lyrics, and chat one-on-one. Includes a role-protected admin console for catalog management.

## ✨ Highlights

* **Global audio player** (persistent) with play/pause, next/prev, seek, volume
* **Repeat modes**: off / one (toggleable)
* **Full-screen “Now Playing”** with dynamic background (dominant color from artwork)
* **Synced lyrics overlay** (LRC) with auto-scroll & active line highlight
* **Real-time social**: friends’ online status + “Listening to …” activity
* **1:1 chat** with live delivery & unread counts
* **Feed** (now only shows **followed users’** activities)
* **Powerful search** across title & artist
* **Admin console** for songs/albums, Cloudinary upload, and lyrics editing
* **Tidy, responsive UI** using Tailwind CSS + shadcn/ui
* **Robust Clerk auth** with admin probe and cache-safe checks

---

## 🧩 Feature Details

### Player & Lyrics

* Global player node (`#global-audio`) shared across UI for rock-solid sync.
* Repeat **one** / **off** indicator and toggle.
* **Single mic icon** for Lyrics (duplicates removed).
* **Overlay lyrics header** (“Lyrics”) fixed + scrolls active line to center.
* Performance-safe LRC parser; handles `mm:ss.xx` and `mm:ss.xxx`.

### Discovery & Library

* Time-based greeting (Good morning/afternoon/evening).
* Sections: **Featured**, **Trending**, **Made For You**.
* **Left sidebar** is independently scrollable (no more cut-off lists).
* **Tunify logo & wordmark** in Topbar; click to return **Home**.
* Logo added to **Album page** only (keeps other routes clean).

### Social

* Friends Activity: shows online status and current track.
  Hover on “Listening to …” reveals **full song + artist** (native title tooltip).
* Chat layout polished: sticky header & input, clean message bubbles, smooth scroll.

### Admin

* **Secure Admin probe:** `GET /api/admin/is-admin` (no caching; varies by `Authorization`).
* Admin allowed by either **email** (`ADMIN_EMAIL`) or **Clerk user id** (`ADMIN_CLERK_ID`).
* When logged in, Topbar shows **Admin Dashboard** button.
* CRUD for Songs & Albums, Cloudinary uploads, and LRC lyrics editor.
* Stats: total users, songs, albums, unique artists.

---

## 🛠 Tech Stack

| Category | Tech                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Zustand, Tailwind, shadcn/ui, React Router, Axios    |
| Backend  | Node.js, Express, MongoDB, Mongoose, Socket.IO, Helmet, Morgan, Rate limiting |
| Auth     | Clerk (Google OAuth)                                                          |
| Storage  | Cloudinary                                                                    |
| Other    | ColorThief (dominant color), LRC parsing                                      |

---

## 🗂 Project Structure (high level)

```
/frontend
  src/
    components/             # Topbar, Player, Lyrics, UI building blocks
    layout/                 # Main layout + Player shell
    pages/                  # Home, Chat, Admin, Album, etc.
    stores/                 # Zustand stores (player, music, chat, auth)
    lib/axios.ts            # Axios instance with Clerk token interceptor

/backend
  src/
    controller/             # admin, user, auth, activity, edit
    routes/                 # admin, users, songs, albums, stats, activity
    middleware/             # protectRoute, requireAdmin
    lib/                    # db, socket, cloudinary
    models/                 # Song, Album, User
    index.js                # App bootstrap
```

---

## 🚀 Getting Started

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

> **Admin rule**
>
> * Set **either** `ADMIN_EMAIL` (matches your login email) **or** `ADMIN_CLERK_ID` (exact Clerk user ID).
> * The admin probe: `GET /api/admin/is-admin` is **no-cache** and varies by `Authorization`.

### 3) Frontend setup

From the **project root**:

```bash
npm install
```

Create `./.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
VITE_BACKEND_API_URL="http://localhost:5000"
```

> If you used `FRONTEND_URL`/`BACKEND_URL` on the server, keep these aligned.

### 4) Seed data (optional)

```bash
# from /backend
npm run seed:albums
# (add additional seed scripts as you need, e.g. songs)
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

Open `http://localhost:3000`.

---

## 🔐 Admin Access – How it works

* Frontend asks `GET /api/admin/is-admin` with your **Clerk bearer token**.
* Backend compares either:

  * your email vs `ADMIN_EMAIL`, **or**
  * your Clerk user id vs `ADMIN_CLERK_ID`.
* The route is explicitly **no-cache** (`Cache-Control: no-store; Vary: Authorization`), so switching users updates immediately.
* When `true`, Topbar shows **Admin Dashboard** button.

**Common gotchas**

* Wrong env var or typo (e.g., missing quotes).
* Logged into a different Clerk account.
* Frontend hitting the wrong backend URL.
* CORS origins missing (`FRONTEND_URL`).

---

## 🧩 Developer Notes & Recent UX Improvements

* **Lyrics overlay header** fixed: always readable; no blurry layer covering the title.
* **Mic icon duplicated** in controls → removed, single toggle remains (right side).
* **Left sidebar**: guaranteed vertical scrollbar; large libraries no longer overflow.
* **Friends Activity tooltip**: native `title` hover shows full “Listening to …” text.
* **Feed**: now filters to **followed users only** (no self-activity noise).
* **Topbar brand**: Tunify logo/name is a link back to **Home**.
* **Album page**: shows Topbar (logo) on this route only; tracks list scrolls independently so the bottom player never overlaps.

---

## 🧪 Scripts

**Backend**

* `npm run dev` – start dev server (nodemon)
* `npm run seed:albums` – seed example albums (add your own seeds as needed)

**Frontend**

* `npm run dev` – Vite dev server
* `npm run build` – production build
* `npm run preview` – preview prod build

---

## 🛡 Security & Hardening

* Helmet CSP (relaxed for audio assets & Cloudinary)
* Rate limiting on `/api`
* Socket.IO auth via Clerk token
* Admin routes protected by `protectRoute` + `requireAdmin`

---

## 🐞 Troubleshooting

* **Admin button doesn’t show**

  * Verify `ADMIN_EMAIL`/`ADMIN_CLERK_ID`.
  * Check Network tab: `GET /api/admin/is-admin` must be `200 { isAdmin: true }`.
  * Ensure the request includes `Authorization: Bearer <token>` (axios interceptor handles this).
* **Lyrics overlay title looks dim/hidden**

  * Make sure you’re on the updated `LyricsView` (fixed header + higher z-index).
* **Tailwind unknown at-rules warnings**

  * VS Code → create `.vscode/settings.json`:

    ```json
    { "css.lint.unknownAtRules": "ignore", "scss.lint.unknownAtRules": "ignore", "less.lint.unknownAtRules": "ignore" }
    ```

---

## 📄 License

MIT — feel free to use, modify, and learn.

---

## 👤 Author

**Raj Shekhar**


