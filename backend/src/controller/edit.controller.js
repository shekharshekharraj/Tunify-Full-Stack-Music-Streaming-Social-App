import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";

export const updateSong = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, artist, duration, lyrics } = req.body; // Add lyrics

		if (!title || !artist || duration === undefined) {
			return res.status(400).json({ message: "Title, artist, and duration are required." });
		}

		const updatedSong = await Song.findByIdAndUpdate(
			id,
			{ title, artist, duration, lyrics }, // Add lyrics to the update object
			{ new: true }
		);

		if (!updatedSong) {
			return res.status(404).json({ message: "Song not found" });
		}

		res.status(200).json(updatedSong);
	} catch (error) {
		next(error);
	}
};

export const updateAlbum = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, artist, releaseYear } = req.body;

		if (!title || !artist || !releaseYear) {
			return res.status(400).json({ message: "Title, artist, and release year are required." });
		}

		const updatedAlbum = await Album.findByIdAndUpdate(
			id,
			{ title, artist, releaseYear },
			{ new: true }
		);

		if (!updatedAlbum) {
			return res.status(404).json({ message: "Album not found" });
		}

		res.status(200).json(updatedAlbum);
	} catch (error) {
		next(error);
	}
};