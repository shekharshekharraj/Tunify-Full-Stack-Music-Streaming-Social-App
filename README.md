<h1># Spotify Clone - Full-Stack Music Streaming & Social App</h1>

<h3>A feature-rich, full-stack music streaming application inspired by Spotify. This project combines a seamless audio playback experience with real-time social features, allowing users to listen to music, see their friends' activity, and chat one-on-one. It also includes a complete administrative backend for managing the music catalog.</h3>

**[ live demo placeholder ]**

## Key Features

### User Features

  * **Authentication**: Secure user sign-up and login via Google OAuth, powered by Clerk.
  * **Music Streaming**: A persistent, global audio player with full playback controls (play/pause, next/previous, seek, volume).
  * **Browse & Discover**: Explore a dynamic homepage with featured, trending, and "Made For You" sections.
  * **Album & Playlist Viewing**: Dive into full album pages with a complete tracklist.
  * **Real-Time Friends Activity**: A live-updating sidebar shows which users are online and what song they are currently listening to.
  * **Real-Time Chat**: Engage in private, one-on-one conversations with other users, with messages delivered instantly via WebSockets.
  * **Responsive Design**: A modern and fully responsive UI built with Tailwind CSS and Shadcn UI that works seamlessly on all devices.

### Admin Features

  * **Admin Dashboard**: A secure, role-protected dashboard for managing the entire music library.
  * **Song Management**: Full CRUD (Create, Read, Update, Delete) functionality for songs, including audio and artwork uploads to Cloudinary.
  * **Album Management**: Full CRUD functionality for albums, allowing admins to create albums and associate songs with them.
  * **Application Statistics**: View key stats like total users, songs, albums, and unique artists.

## Tech Stack

| Category          | Technology / Library                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Frontend** | React, TypeScript, Vite, Zustand, Tailwind CSS, Shadcn UI, React Router, Axios                         |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, Socket.IO                                                      |
| **Authentication**| Clerk                                                                                                  |
| **File Storage** | Cloudinary                                                                                             |
| **Database** | MongoDB Atlas                                                                                          |

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

  * Node.js
  * npm 
  * A MongoDB Atlas account (or a local MongoDB instance)
  * A Clerk account
  * A Cloudinary account

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/spotify-clone.git
    cd spotify-clone
    ```

2.  **Setup the Backend:**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file in the `backend` directory and add the following environment variables:

    ```env
    PORT=5000
    MONGODB_URI="your_mongodb_connection_string"
    ADMIN_EMAIL="your_email_for_admin_access"
    CLERK_SECRET_KEY="your_clerk_secret_key"
    CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
    CLOUDINARY_API_KEY="your_cloudinary_api_key"
    CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
    ```

3.  **Setup the Frontend:**
    In a new terminal, navigate to the root directory of the project.

    ```bash
    # (From the root directory)
    npm install
    ```

    Create a `.env.local` file in the root directory and add your Clerk Publishable Key:

    ```env
    VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
    ```

### Seeding the Database

The backend includes scripts to populate your database with sample songs and albums.

  * To seed only songs:
    ```bash
    # From the backend directory
    npm run seed:songs
    ```
  * To seed songs and group them into albums (recommended):
    ```bash
    # From the backend directory
    npm run seed:albums
    ```

### Available Scripts

  * **Running the Backend Server:**

    ```bash
    # From the backend directory
    npm run dev
    ```

    The backend server will start on `http://localhost:5000`.

  * **Running the Frontend Development Server:**

    ```bash
    # From the root directory
    npm run dev
    ```

    The frontend application will be available at `http://localhost:3000`.

## Project Architecture

The project is structured as a monorepo with two main parts:

  * **`/` (Root):** Contains the entire frontend React application, built with Vite and TypeScript. All UI components, pages, state management stores (Zustand), and utility functions are located in the `/src` directory.
  * **`/backend`:** Contains the Node.js and Express.js server. It follows a standard MVC-like pattern with routes, controllers, models, and middleware. It handles all API logic, database interactions, WebSocket connections, and authentication checks.

<h3>##Made with Love By Raj Shekharg</h3>