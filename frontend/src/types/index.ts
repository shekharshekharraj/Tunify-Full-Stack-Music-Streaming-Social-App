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
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

// --- THE FIX IS HERE ---
// This interface was incorrect. It has been updated to match your code.
export interface User {
	_id: string;
	clerkId: string;
// Your components are expecting `fullName` and `imageUrl`, not the old properties.
	fullName: string;
	imageUrl: string;
}
// --- END OF FIX ---