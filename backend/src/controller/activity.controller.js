// backend/controller/activitycontroller.js
import mongoose from "mongoose";
import { Activity } from "../models/activity.model.js";
import { User } from "../models/user.model.js";
import { genError } from "../utils/genError.js";

// Log a "listened_to_song" activity
export const logSongListen = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const currentUserClerkId = req.auth?.userId;

    if (!currentUserClerkId) return next(genError(401, "Unauthorized"));

    const user = await User.findOne({ clerkId: currentUserClerkId }).select("_id fullName imageUrl");
    if (!songId || !user) return next(genError(400, "Song ID and valid user are required"));

    const created = await Activity.create({
      type: "listened_to_song",
      userId: user._id,
      songId,
    });

    const populated = await Activity.findById(created._id)
      .populate("userId", "fullName imageUrl")
      .populate("songId", "title artist");

    // emit to all clients
    const io = req.app?.get("io");
    if (io) {
      io.emit("new_activity", populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// Fetch feed for logged-in user
export const getFeed = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth?.userId;
    if (!currentUserClerkId) return next(genError(401, "Unauthorized"));

    // Current user (we need _id and following)
    const user = await User.findOne({ clerkId: currentUserClerkId }).select("_id following");
    if (!user) return next(genError(404, "User not found"));

    let followingIds = user.following || [];

    // If following contains Clerk IDs, convert → MongoIDs
    if (followingIds.length > 0 && !mongoose.Types.ObjectId.isValid(followingIds[0])) {
      const followedUsers = await User.find({ clerkId: { $in: followingIds } }).select("_id");
      followingIds = followedUsers.map((u) => u._id);
    } else {
      followingIds = followingIds.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (!followingIds.length) return res.status(200).json([]);

    // ✅ Only followed users, and explicitly exclude the current user (defensive)
    const feed = await Activity.find({
      userId: { $in: followingIds, $ne: user._id },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "fullName imageUrl")
      .populate("songId", "title artist");

    res.status(200).json(feed);
  } catch (error) {
    next(error);
  }
};
