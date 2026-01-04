🎵 Tunify — Full-Stack Music Streaming & Social Platform
A feature-rich, full-stack music streaming application that seamlessly blends a global audio player with real-time social features. Stream music, host synchronized party rooms, chat live, follow along with LRC lyrics, and discover new tracks with AI-powered recommendations and YouTube integration.
🔗 Live Demo: www.tunify.co.in

📑 Table of Contents

Overview
Key Features
Tech Stack
Project Structure
Installation
Environment Variables
Usage
Feature Details
API Endpoints
Deployment
Security
Contributing
License
Author


🎯 Overview
Tunify is a modern music streaming platform that combines the best of Spotify-like functionality with real-time social features. Built with React and Node.js, it offers a seamless listening experience across devices with synchronized playback, live chat, and AI-assisted music discovery.
Why Tunify?

Universal Player Experience — Persistent audio playback that follows you across the entire application
Social First — See what friends are listening to, host party rooms, and chat in real-time
AI-Powered Discovery — Get personalized recommendations through conversational AI
YouTube Integration — Discover and play music videos without leaving the app
Developer Friendly — Clean architecture, comprehensive API, and extensive documentation


✨ Key Features
🎵 Audio Player

Global Persistent Player — Continuous playback across all routes with play/pause, seek, skip, repeat modes, and volume control
Keyboard Shortcuts — Space (play/pause), ←/→ (seek ±5s), ↑/↓ (volume adjustment)
Immersive Now Playing View — Full-screen player with dynamic ambient background using ColorThief, smooth dock transitions, and smart cursor hide logic
Advanced Controls — Repeat (one/all/off), shuffle, queue management, and cross-fade support

🎤 Lyrics & Synchronization

LRC Lyrics Sync — Auto-scrolling synchronized lyrics with active line highlighting
Multiple Format Support — Handles both mm:ss.xx and mm:ss.xxx timestamp formats
Manual Sync Adjustment — Quick ±100ms nudges for perfect timing
Mobile Optimized — Touch-friendly lyrics interface with smooth scrolling
Word-Level Highlighting — Precise word-by-word synchronization for supported tracks

👥 Social Features

Party Rooms — Real-time synchronized playback using Socket.IO + WebRTC with <100ms latency
Live Presence — See what friends are currently listening to with "Listening to..." activity feed
1:1 Chat — Direct messaging with delivery receipts and unread count badges
Emoji Reactions — Express yourself with animated emoji bursts during playback
Room Chat — Group conversations within party rooms with user presence indicators

▶️ YouTube Integration

Mini Player Dock — Slide-in right-side mini player accessible from the player bar

Draggable and scrollable panel with smart height management
Privacy-focused youtube-nocookie.com embeds
Compact suggestion chips for quick discovery
Seamless video switching without page reload


YouTube Music Explorer (/yt route)

Dedicated discovery interface with elegant UI
Tab-based navigation with gradient animations
Modal iFrame player for inline playback
Search suggestions with thumbnail previews
Skeleton loading states for smooth UX



🤖 AI-Powered Features

Gemini Chatbot — Conversational AI assistant for:

Personalized playlist curation
Mood-based music recommendations
Genre exploration and discovery prompts
Natural language music queries



📰 What's New

Live Updates — Server-Sent Events (SSE) for real-time product announcements
Smart Fallback — Demo content when backend is unavailable
Admin Seeding — Easy content management through seed scripts

🛠️ Admin Console

Role-Based Access — Protected CRUD operations for administrators
Content Management — Add, edit, and delete songs, albums, and playlists
Cloudinary Integration — Direct upload of audio files and album artwork
Live LRC Editor — In-browser lyrics timing editor with preview
Analytics Dashboard — Track plays, user engagement, and platform statistics

📱 User Experience

Responsive Design — Tailwind CSS + shadcn/ui components for all screen sizes
Smooth Animations — Polished micro-interactions and transitions
Accessibility — ARIA labels, keyboard navigation, and screen reader support
Independent Scrolling — Sidebar and content areas scroll separately for better navigation
Time-Based Greetings — Personalized welcome messages based on time of day


🛠️ Tech Stack
Frontend
TechnologyPurposeReact 18UI library with hooks and concurrent featuresTypeScriptType-safe developmentViteLightning-fast build tool and dev serverZustandLightweight state management with persistenceReact RouterClient-side routingTailwind CSSUtility-first stylingshadcn/uiBeautiful, accessible component libraryAxiosHTTP client for API callsColorThiefDynamic color extraction from artwork
Backend
TechnologyPurposeNode.jsJavaScript runtimeExpressWeb application frameworkMongoDBNoSQL databaseMongooseODM for MongoDBSocket.IOReal-time bidirectional communicationHelmetSecurity middlewareMorganHTTP request loggerExpress Rate LimitAPI rate limiting
Authentication & Storage
TechnologyPurposeClerkAuthentication (Email + Google OAuth) with RBACCloudinaryCloud storage for audio files and artwork
AI & Media
TechnologyPurposeGemini APIAI chatbot and recommendationsYouTube iFrame APIVideo embedding (youtube-nocookie)ytmusic-apiYouTube Music search and suggestionsLRC ParserCustom lyrics parsing and synchronization
DevOps
TechnologyPurposeRenderCloud hosting platformGitVersion controlESLintCode lintingPrettierCode formatting

📂 Project Structure
tunify/
│
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Player/          # Global player components
│   │   │   ├── Lyrics/          # LRC lyrics components
│   │   │   ├── Social/          # Chat, friends, activity
│   │   │   ├── YouTube/         # Mini player and explorer
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── pages/               # Route components
│   │   │   ├── Home.tsx
│   │   │   ├── NowPlaying.tsx
│   │   │   ├── PartyRoom.tsx
│   │   │   ├── YouTubeExplorer.tsx
│   │   │   ├── WhatsNew.tsx
│   │   │   └── Admin/
│   │   ├── stores/              # Zustand state management
│   │   │   ├── usePlayerStore.ts
│   │   │   ├── useChatStore.ts
│   │   │   └── useAuthStore.ts
│   │   ├── lib/                 # Utilities and helpers
│   │   │   ├── lrcParser.ts
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── types/               # TypeScript type definitions
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Application entry point
│   ├── public/                  # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── song.controller.js
│   │   │   ├── album.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── party.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── whatsnew.controller.js
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Song.js
│   │   │   ├── Album.js
│   │   │   ├── Message.js
│   │   │   ├── Party.js
│   │   │   └── WhatsNew.js
│   │   ├── middleware/          # Custom middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── admin.middleware.js
│   │   │   └── rateLimit.middleware.js
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── song.routes.js
│   │   │   ├── album.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── party.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── whatsnew.routes.js
│   │   ├── services/            # Business logic
│   │   │   ├── cloudinary.service.js
│   │   │   ├── gemini.service.js
│   │   │   └── socket.service.js
│   │   ├── seeds/               # Database seed data
│   │   │   └── whatsnew.json
│   │   ├── utils/               # Helper functions
│   │   │   ├── logger.js
│   │   │   └── validators.js
│   │   ├── config/              # Configuration files
│   │   │   ├── database.js
│   │   │   └── security.js
│   │   └── server.js            # Express app setup
│   ├── scripts/                 # Utility scripts
│   │   └── seed-whatsnew.mjs
│   ├── package.json
│   └── .env.example
│
├── dist/                        # Production build (generated)
├── .gitignore
├── README.md
└── LICENSE

⚙️ Installation
Prerequisites

Node.js (v18 or higher)
npm or yarn
MongoDB (local or Atlas)
Clerk Account (for authentication)
Cloudinary Account (for media storage)
Gemini API Key (for AI features)

1. Clone the Repository
bashgit clone https://github.com/shekharshekharraj/tunify.git
cd tunify
2. Backend Setup
bashcd backend
npm install
Create a .env file in the backend/ directory:
env# Server
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/tunify
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tunify

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Admin
SEED_KEY=your_secure_seed_key
ADMIN_EMAILS=admin@example.com,admin2@example.com

# CORS
FRONTEND_URL=http://localhost:5173
3. Frontend Setup
bashcd ../frontend
npm install
Create a .env file in the frontend/ directory:
envVITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
4. Seed Database (Optional)
bashcd ../backend
node scripts/seed-whatsnew.mjs
5. Run the Application
Backend (Terminal 1):
bashcd backend
npm run dev
Frontend (Terminal 2):
bashcd frontend
npm run dev
Open http://localhost:5173 in your browser.

🔑 Environment Variables
Backend Environment Variables
VariableDescriptionRequiredPORTServer portYes (default: 5000)NODE_ENVEnvironment modeYesMONGODB_URIMongoDB connection stringYesCLERK_SECRET_KEYClerk authentication secretYesCLERK_PUBLISHABLE_KEYClerk public keyYesCLOUDINARY_CLOUD_NAMECloudinary cloud nameYesCLOUDINARY_API_KEYCloudinary API keyYesCLOUDINARY_API_SECRETCloudinary API secretYesGEMINI_API_KEYGoogle Gemini API keyYesSEED_KEYSeed script authorization keyNoADMIN_EMAILSComma-separated admin emailsNoFRONTEND_URLFrontend URL for CORSYesBASE_URLBackend base URLNo
Frontend Environment Variables
VariableDescriptionRequiredVITE_API_URLBackend API endpointYesVITE_SOCKET_URLSocket.IO server URLYesVITE_CLERK_PUBLISHABLE_KEYClerk public keyYes

🎮 Usage
For Users

Sign Up / Sign In

Use email or Google OAuth via Clerk
Automatic profile creation


Browse Music

Explore featured playlists on home page
Browse by albums, artists, or genres
Use time-based recommendations


Play Music

Click any song to start playback
Use keyboard shortcuts for quick control
View synchronized lyrics in Now Playing


Discover with YouTube

Open mini player from player bar
Search YouTube Music in /yt explorer
Play videos inline without leaving Tunify


Social Features

See what friends are listening to
Join or create party rooms
Chat with friends in real-time


AI Assistant

Ask for music recommendations
Create mood-based playlists
Discover new artists and genres



For Admins

Access Admin Console

Navigate to /admin (requires admin role)
Manage songs, albums, and playlists


Upload Content

Upload audio files directly to Cloudinary
Add album artwork and metadata
Create and edit LRC lyrics


Monitor Platform

View analytics and user statistics
Manage "What's New" announcements
Moderate user content




🔍 Feature Details
Global Audio Player
The heart of Tunify is its persistent audio player that maintains playback state across the entire application.
Technical Implementation:

Single <audio id="global-audio"> element managed by Zustand
State persistence in localStorage
Audio context resume handling for iOS/Safari
Crossfade transitions between tracks
Gapless playback support

Keyboard Shortcuts:
KeyActionSpacePlay/Pause←Seek backward 5s→Seek forward 5s↑Increase volume↓Decrease volumeMMute/UnmuteLToggle lyrics
LRC Lyrics System
Format Support:
lrc[00:12.00]First line of lyrics
[00:17.20]Second line of lyrics
[00:21.10]Third line of lyrics
Features:

Auto-scroll to active line
Manual sync adjustment (±100ms)
Word-level highlighting for enhanced LRC
Mobile-optimized touch scrolling
Fallback to plain text if no LRC available

Parser Logic:
typescript// Supports both mm:ss.xx and mm:ss.xxx formats
const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
Party Rooms
Real-Time Synchronization:

WebRTC for sub-100ms audio sync
Socket.IO for state management and chat
Leader/follower architecture
Automatic reconnection handling

Features:

Shared queue management
Live participant list with presence
Emoji reactions with animations
Group chat with message history
Role-based controls (host/participant)

Technical Stack:
javascript// Socket.IO events
socket.on('party:sync', handleSync);
socket.on('party:queue:update', updateQueue);
socket.on('party:chat:message', handleMessage);
socket.on('party:reaction', handleReaction);
YouTube Integration
Mini Player Dock
Access: Click the TV/device icon in the player bar (top-right control cluster)
Features:

Slides in from right side of screen
Draggable and resizable
youtube-nocookie.com embeds for privacy
Compact suggestion chips
Seamless video switching
Max-height confinement with internal scroll

Implementation:
tsx<iframe
  src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&playsinline=1`}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
YouTube Music Explorer (/yt)
Features:

Dedicated search interface
Tab-based navigation
Modal video player
Suggestion chips
Thumbnail previews
Gradient animations
Skeleton loading states

Search Flow:

User enters search query
ytmusic-api fetches results
Results displayed with thumbnails
Click to play in modal iFrame
Suggestions update based on selection

AI Chatbot (Gemini)
Capabilities:

Natural language music queries
Mood-based recommendations
Playlist generation
Artist discovery
Genre exploration

Example Queries:
"Find me upbeat songs for a workout"
"Create a relaxing evening playlist"
"What's similar to [Artist Name]?"
"Songs for a road trip"
Implementation:
javascriptconst response = await gemini.generateContent({
  prompt: userMessage,
  context: userPreferences,
  history: chatHistory
});
What's New System
Data Flow:

Admin creates announcement via seed script or admin panel
Content stored in MongoDB
SSE endpoint streams updates to clients
Fallback to demo content if server unavailable

Seeding:
bash# Using Node.js script
node scripts/seed-whatsnew.mjs

# Or PowerShell cURL
curl -X POST http://localhost:5000/api/admin/seed-whatsnew `
  -H "x-seed-key: your_seed_key" `
  -H "Content-Type: application/json" `
  -d @backend/src/seeds/whatsnew.json
SSE Implementation:
typescriptconst eventSource = new EventSource('/api/whats-new/stream');
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update UI with new announcement
};

📡 API Endpoints
Authentication
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/logout            # Logout user
GET    /api/auth/me                # Get current user
Songs
GET    /api/songs                  # Get all songs
GET    /api/songs/:id              # Get song by ID
GET    /api/songs/featured         # Get featured songs
GET    /api/songs/trending         # Get trending songs
POST   /api/songs                  # Create song (admin)
PUT    /api/songs/:id              # Update song (admin)
DELETE /api/songs/:id              # Delete song (admin)
Albums
GET    /api/albums                 # Get all albums
GET    /api/albums/:id             # Get album by ID
POST   /api/albums                 # Create album (admin)
PUT    /api/albums/:id             # Update album (admin)
DELETE /api/albums/:id             # Delete album (admin)
Social
GET    /api/users/friends          # Get friends list
GET    /api/users/activity         # Get friends' activity
POST   /api/chat/send              # Send message
GET    /api/chat/:userId           # Get chat history
GET    /api/chat/unread            # Get unread count
Party Rooms
POST   /api/party/create           # Create party room
GET    /api/party/:id              # Get party details
POST   /api/party/:id/join         # Join party
POST   /api/party/:id/leave        # Leave party
POST   /api/party/:id/queue        # Update queue
Admin
GET    /api/admin/is-admin         # Check admin status
GET    /api/admin/stats            # Get platform statistics
POST   /api/admin/upload           # Upload to Cloudinary
POST   /api/admin/seed-whatsnew    # Seed announcements
What's New
GET    /api/whats-new              # Get all announcements
GET    /api/whats-new/stream       # SSE stream for updates
POST   /api/whats-new              # Create announcement (admin)
PUT    /api/whats-new/:id          # Update announcement (admin)
DELETE /api/whats-new/:id          # Delete announcement (admin)

🚀 Deployment
Render Deployment (Recommended)
Platform: Render - Single web service serving both API and static frontend
Build Configuration
json{
  "build": "npm run build",
  "start": "npm start"
}
Environment Setup
Required Environment Variables:
env# Database
MONGODB_URI=mongodb+srv://...

# Authentication
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# AI
GEMINI_API_KEY=...

# Admin
SEED_KEY=...
ADMIN_EMAILS=...

# URLs
FRONTEND_URL=https://tunify.co.in
BASE_URL=https://tunify.co.in
Build Process

Install Dependencies

bash   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..

Build Frontend

bash   cd frontend && npm run build
This creates dist/ folder with production-ready React app

Start Server

bash   cd backend && npm start
Express serves both API routes and static files from ../frontend/dist
Content Security Policy
Helmet is configured with relaxed policies for YouTube embeds:
javascriptapp.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.youtube-nocookie.com",
        "https://www.youtube.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://i.ytimg.com",
        "https://res.cloudinary.com"
      ],
      mediaSrc: [
        "'self'",
        "https://res.cloudinary.com"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
Autoplay Considerations

Mobile browsers may block autoplay without user gesture
Use playsinline=1 parameter for iFrames
Trigger playback after user interaction (click/tap)
Handle suspended audio contexts with resumeAudioContext() helper

Alternative Deployment Options
Vercel (Frontend) + Render (Backend)
Frontend (Vercel):
bashcd frontend
vercel --prod
Backend (Render):

Deploy as separate service
Update VITE_API_URL in frontend env

Docker Deployment
dockerfile# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]

🔐 Security
Authentication & Authorization
Clerk Integration:

JWT-based authentication
OAuth 2.0 with Google provider
Role-Based Access Control (RBAC)
Session management with automatic refresh

Admin Protection:
javascript// Server-side admin check
const isAdmin = await checkAdminStatus(userId);
if (!isAdmin) {
  return res.status(403).json({ error: 'Unauthorized' });
}
API Security
Rate Limiting:
javascriptconst limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
Helmet Security Headers:

XSS Protection
No Sniff
Frame Options
HSTS
CSP (Content Security Policy)

CORS Configuration:
javascriptapp.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
Socket.IO Security
Authentication Handshake:
javascriptio.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyClerkToken(token);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
Data Protection

Input Validation — Sanitize all user inputs
Parameterized Queries — Prevent NoSQL injection
File Upload Limits — Max 50MB for audio files
Secure File Storage — Cloudinary with signed URLs
Environment Variables — Never commit secrets to git


🧪 Testing
Run Tests
bash# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
Test Coverage
bashnpm run test:coverage

📈 Performance Optimization
Frontend Optimizations

Code Splitting — React lazy loading for routes
Image Optimization — Responsive images with Cloudinary
Bundle Analysis — Vite rollup analysis
Caching Strategy — Service worker for offline support

Backend Optimizations

Database Indexing — Optimized MongoDB queries
Connection Pooling — MongoDB connection reuse
Response Compression — Gzip compression
CDN Integration — Cloudinary for media delivery


🤝 Contributing
Contributions are welcome! Please follow these guidelines:
How to Contribute

Fork the Repository

bash   git clone https://github.com/shekharshekharraj/tunify.git
   cd tunify
   git checkout -b feature/your-feature-name

Make Changes

Follow the existing code style
Add tests for new features
Update documentation as needed


Commit Changes

bash   git add .
   git commit -m "feat: add your feature description"

Push and Create PR

bash   git push origin feature/your-feature-name
Then create a Pull Request on GitHub
Commit Convention
Follow Conventional Commits:

feat: — New feature
fix: — Bug fix
docs: — Documentation changes
style: — Code style changes (formatting)
refactor: — Code refactoring
test: — Adding tests
chore: — Maintenance tasks

Code Style

Frontend: ESLint + Prettier
Backend: ESLint + Prettier
Run npm run lint before committing


📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

shadcn/ui — Beautiful component library
Clerk — Seamless authentication
Cloudinary — Reliable media storage
Render — Easy deployment platform
YouTube — Music discovery integration
Google Gemini — AI-powered recommendations

## 📸 Screenshots

<img width="1918" height="906" alt="Now Playing" src="https://github.com/user-attachments/assets/72d6abc7-4192-4e00-aac0-f107fdfc9f0a" />
<img width="1918" height="910" alt="Home & Feed" src="https://github.com/user-attachments/assets/cc08e2b7-7810-4e7c-a066-09df26868bcd" />

---

## 👤 Author

**Raj Shekhar** – Full-Stack Developer
🔗 [GitHub](https://github.com/shekharshekharraj) • [LinkedIn](https://www.linkedin.com/in/raj-shekhar~/)

---
