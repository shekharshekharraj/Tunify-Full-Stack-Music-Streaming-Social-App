// backend/scripts/migrateFollowingToMongoIds.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, {});
  try {
    const allUsers = await User.find().select("_id clerkId following");
    const clerkToMongo = new Map(allUsers.map((u) => [u.clerkId, u._id.toString()]));

    for (const u of allUsers) {
      let following = Array.isArray(u.following) ? [...u.following] : [];

      if (following.length > 0 && !mongoose.Types.ObjectId.isValid(following[0])) {
        following = following.map((clerkId) => clerkToMongo.get(clerkId)).filter(Boolean);
      } else {
        following = following.map((id) => id?.toString?.()).filter(Boolean);
      }

      following = following.filter((id) => id !== u._id.toString());

      const prev = (u.following || []).map((id) => id?.toString?.()).filter(Boolean);
      const eq = prev.length === following.length && prev.every((v, i) => v === following[i]);
      if (!eq) {
        await User.findByIdAndUpdate(u._id, { following });
        console.log(`Updated following for ${u.clerkId} -> ${following.length} entries`);
      }
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
