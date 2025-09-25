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
