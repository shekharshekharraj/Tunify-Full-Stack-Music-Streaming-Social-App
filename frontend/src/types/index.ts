// types/index.ts

export interface CommentUser {
  _id: string;
  fullName: string;
  imageUrl: string;
  clerkId: string;
}

export interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser; // populated author info
}

export interface Song {
  _id: string;
  title: string;
  artist: string;
  albumId: string | null;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  lyrics?: string;

  // NEW: social
  likes?: string[];     // Clerk IDs of users who liked
  comments?: Comment[]; // optional when populated
}

export interface Album {
  _id: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseYear: number;
  songs: Song[];
}

export interface Stats {
  totalSongs: number;
  totalAlbums: number;
  totalUsers: number;
  totalArtists: number;
}

export interface Message {
  _id: string;
  sender: string;   // Mongo _id
  receiver: string; // Mongo _id
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  clerkId: string;
  fullName: string;
  imageUrl: string;
  following: string[];
  followers: string[];
  isFollowing?: boolean;
}

export type Activity = {
  _id: string;
  type: "listened_to_song";
  userId: Pick<User, "_id" | "fullName" | "imageUrl">;
  songId: Pick<Song, "_id" | "title" | "artist">;
  createdAt: string;
};

// (Optional) handy shape if you use paginated comments responses
export interface PaginatedComments {
  comments: Comment[];
  page: number;
  limit: number;
  total: number;
}
