import mongoose from "mongoose";

const PartySchema = new mongoose.Schema({
  hostUserId: { type: String, required: true },
  code: { type: String, unique: true, index: true },
  isActive: { type: Boolean, default: true },

  nowPlaying: {
    songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
    audioUrl: String,
    positionMs: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
}, { timestamps: true });

export const Party = mongoose.model("Party", PartySchema);
