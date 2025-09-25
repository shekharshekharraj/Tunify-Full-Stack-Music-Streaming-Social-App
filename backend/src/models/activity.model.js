import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ["listened_to_song"], // Extensible for future activities
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		songId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Song",
			required: true,
		},
	},
	{ timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);