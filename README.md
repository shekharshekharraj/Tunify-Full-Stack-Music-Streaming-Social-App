# Tunify - Full-Stack Music Streaming & Social App

A feature-rich, full-stack music streaming application inspired by latest Music Leading Platform. This project combines a seamless, immersive audio playback experience with a real-time social layer, allowing users to listen to music, see their friends' activity, view synchronized lyrics, and chat one-on-one. It also includes a complete administrative backend for managing the music catalog.

## Key Features

### User Features

  * **Authentication**: Secure user sign-up and login via Google OAuth, powered by Clerk.
  * **Dynamic Music Player**:
      * A persistent, global audio player with full playback controls (play/pause, next/previous, seek, volume).
      * **Loop Functionality:** Cycle between repeating a single track or the entire queue.
      * **Full-Screen Mode:** An immersive "Now Playing" view with a dynamic, translucent background that adapts to the album art's dominant color.
  * **Synchronized Lyrics**: A real-time lyrics view that highlights the currently sung line in sync with the audio, powered by LRC timestamp parsing.
  * **Browse & Discover**: Explore a dynamic homepage with a time-based greeting (Good morning/afternoon/evening) and curated sections for "Featured," "Trending," and "Made For You" songs.
  * **Real-Time Social Layer**:
      * **Friends Activity:** A live-updating sidebar shows which users are online and what song they are currently listening to.
      * **Real-Time Chat:** Engage in private, one-on-one conversations with real-time message delivery and unread message count notifications.
  * **Search**: Instantly search the entire music catalog by song title or artist.
  * **Responsive Design**: A modern and fully responsive UI built with Tailwind CSS and Shadcn UI that works seamlessly on all devices.

### Admin Features

  * **Admin Dashboard**: A secure, role-protected dashboard for managing the entire music library.
  * **Song & Album Management**: Full CRUD (Create, Read, Update, Delete) functionality for songs and albums, including audio/artwork uploads to Cloudinary and a rich text editor for adding/editing LRC-formatted lyrics.
  * **Application Statistics**: View key stats like total users, songs, albums, and unique artists.
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/38a37497-0853-4015-a50d-8848e7c9f5f6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f9c396ba-e3cf-4104-bce9-f21bac119018" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dafa0385-698b-43b3-9047-fd2387765dce" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/87a45fe7-b95e-4f3e-97b0-96ac6246f6f1" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d4d639ab-8e72-4574-bb58-20c47ca7184a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7dbf8e56-1b4e-4df1-853e-d5e6f259e8c6" />

## Tech Stack

| Category         | Technology / Library                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| **Frontend** | React, TypeScript, Vite, Zustand, Tailwind CSS, Shadcn UI, React Router, Axios, ColorThief             |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Helmet (for CSP)                                    |
| **Authentication**| Clerk                                                                                                  |
| **File Storage** | Cloudinary                                                                                             |
| **Database** | MongoDB Atlas                                                                                          |

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

  * Node.js (v18.x or higher)
  * npm 
  * A MongoDB Atlas account
  * A Clerk account
  * A Cloudinary account

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/shekharshekharraj/Tunify-Full-Stack-Music-Streaming-Social-App.git
    cd Tunify-Full-Stack-Music-Streaming-Social-App
    ```

2.  **Setup the Backend:**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file in the `backend` directory and add your environment variables:

    ```env
    PORT=5000
    MONGODB_URI="your_mongodb_connection_string"
    ADMIN_EMAIL="your_email_for_admin_access"
    CLERK_SECRET_KEY="your_clerk_secret_key"
    CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
    CLOUDINARY_API_KEY="your_cloudinary_api_key"
    CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
    ```

3.  **Setup the Frontend:** In a new terminal, navigate to the project's root directory.

    ```bash
    # (From the root directory)
    npm install
    ```

    Create a `.env.local` file in the root directory:

    ```env
    VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
    VITE_BACKEND_API_URL="http://localhost:5000"
    ```

### Seeding the Database

The backend includes scripts to populate your database with sample songs and albums.

```bash
# From the backend directory
npm run seed:albums
```

### Available Scripts

  * **Run Backend Server:**

    ```bash
    # From the backend directory
    npm run dev
    ```

  * **Run Frontend Server:**

    ```bash
    # From the root directory
    npm run dev
    ```

## Author
Raj Shekhar
