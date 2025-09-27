// backend/src/models/song.model.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: true, timestamps: true }
);

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    audioUrl: { type: String, required: true },
    imageUrl: { type: String, required: true },
    duration: { type: Number, required: true, default: 0 },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album", default: null },
    lyrics: { type: String, default: "" },

    // NEW
    likes: { type: [String], default: [] }, // store Clerk IDs for fast toggle
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

export const Song = mongoose.model("Song", songSchema);
