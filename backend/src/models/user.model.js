import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
		},
		clerkId: {
			type: String,
			required: true,
			unique: true,
		},
		following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // NEW FIELD
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // NEW FIELD
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);