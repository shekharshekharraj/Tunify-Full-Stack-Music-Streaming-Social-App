// backend/controller/usercontroller.js
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const getCurrentUser = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth?.userId;
    if (!currentUserClerkId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: currentUserClerkId });
    if (!user) return res.status(404).json({ message: "Current user not found in database" });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const currentClerkId = req.auth?.userId;
    if (!currentClerkId) return res.status(401).json({ message: "Unauthorized" });

    const users = await User.find({ clerkId: { $ne: currentClerkId } });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth?.userId;
    const { userId: otherUserClerkId } = req.params;

    if (!currentUserClerkId) return res.status(401).json({ message: "Unauthorized" });
    if (!otherUserClerkId) return res.status(400).json({ message: "User ID required" });

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    const otherUser = await User.findOne({ clerkId: otherUserClerkId });
    if (!currentUser || !otherUser) return res.status(404).json({ message: "User not found." });

    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, receiver: otherUser._id },
        { sender: otherUser._id, receiver: currentUser._id },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const toggleFollow = async (req, res, next) => {
  try {
    const currentClerkId = req.auth?.userId;
    const { targetUserClerkId } = req.params;

    if (!currentClerkId) return res.status(401).json({ message: "Unauthorized" });
    if (currentClerkId === targetUserClerkId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const currentUser = await User.findOne({ clerkId: currentClerkId });
    const targetUser = await User.findOne({ clerkId: targetUserClerkId });
    if (!currentUser || !targetUser) return res.status(404).json({ message: "User not found." });

    const isFollowing = currentUser.following.includes(targetUser._id);
    let action;

    if (isFollowing) {
      await User.findByIdAndUpdate(currentUser._id, { $pull: { following: targetUser._id } });
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: currentUser._id } });
      action = "unfollowed";
    } else {
      await User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: targetUser._id } });
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: currentUser._id } });
      action = "followed";
    }

    res.status(200).json({ message: `Successfully ${action}.`, action });
  } catch (error) {
    next(error);
  }
};
