// backend/scripts/seedSafe.js
import mongoose from "mongoose";
import { config } from "dotenv";
import { Song } from "../src/models/song.model.js";   // adjust if your models path differs
import { Album } from "../src/models/album.model.js";

config();

const songsSeed = [
  { title: "Stay With Me", artist: "Sarah Mitchell", imageUrl: "/cover-images/1.jpg", audioUrl: "/songs/1.mp3", duration: 46 },
  { title: "Midnight Drive", artist: "The Wanderers", imageUrl: "/cover-images/2.jpg", audioUrl: "/songs/2.mp3", duration: 41 },
  { title: "Lost in Tokyo", artist: "Electric Dreams", imageUrl: "/cover-images/3.jpg", audioUrl: "/songs/3.mp3", duration: 24 },
  { title: "Summer Daze", artist: "Coastal Kids", imageUrl: "/cover-images/4.jpg", audioUrl: "/songs/4.mp3", duration: 24 },
  { title: "Neon Lights", artist: "Night Runners", imageUrl: "/cover-images/5.jpg", audioUrl: "/songs/5.mp3", duration: 36 },
  { title: "Mountain High", artist: "The Wild Ones", imageUrl: "/cover-images/6.jpg", audioUrl: "/songs/6.mp3", duration: 40 },
  { title: "City Rain", artist: "Urban Echo", imageUrl: "/cover-images/7.jpg", audioUrl: "/songs/7.mp3", duration: 39 },
  { title: "Desert Wind", artist: "Sahara Sons", imageUrl: "/cover-images/8.jpg", audioUrl: "/songs/8.mp3", duration: 28 },
  { title: "Ocean Waves", artist: "Coastal Drift", imageUrl: "/cover-images/9.jpg", audioUrl: "/songs/9.mp3", duration: 28 },
  { title: "Starlight", artist: "Luna Bay", imageUrl: "/cover-images/10.jpg", audioUrl: "/songs/10.mp3", duration: 30 },
  { title: "Winter Dreams", artist: "Arctic Pulse", imageUrl: "/cover-images/11.jpg", audioUrl: "/songs/11.mp3", duration: 29 },
  { title: "Purple Sunset", artist: "Dream Valley", imageUrl: "/cover-images/12.jpg", audioUrl: "/songs/12.mp3", duration: 17 },
  { title: "Neon Dreams", artist: "Cyber Pulse", imageUrl: "/cover-images/13.jpg", audioUrl: "/songs/13.mp3", duration: 39 },
  { title: "Moonlight Dance", artist: "Silver Shadows", imageUrl: "/cover-images/14.jpg", audioUrl: "/songs/14.mp3", duration: 27 },
  { title: "Urban Jungle", artist: "City Lights", imageUrl: "/cover-images/15.jpg", audioUrl: "/songs/15.mp3", duration: 36 },
  { title: "Crystal Rain", artist: "Echo Valley", imageUrl: "/cover-images/16.jpg", audioUrl: "/songs/16.mp3", duration: 39 },
  { title: "Neon Tokyo", artist: "Future Pulse", imageUrl: "/cover-images/17.jpg", audioUrl: "/songs/17.mp3", duration: 39 },
  { title: "Midnight Blues", artist: "Jazz Cats", imageUrl: "/cover-images/18.jpg", audioUrl: "/songs/18.mp3", duration: 29 },
];

const albumsSeed = [
  { title: "Urban Nights", artist: "Various Artists", imageUrl: "/albums/1.jpg", releaseYear: 2024, songRange: [0, 4] },
  { title: "Coastal Dreaming", artist: "Various Artists", imageUrl: "/albums/2.jpg", releaseYear: 2024, songRange: [4, 8] },
  { title: "Midnight Sessions", artist: "Various Artists", imageUrl: "/albums/3.jpg", releaseYear: 2024, songRange: [8, 11] },
  { title: "Eastern Dreams", artist: "Various Artists", imageUrl: "/albums/4.jpg", releaseYear: 2024, songRange: [11, 14] },
];

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(process.env.MONGODB_URI);

  // 1) Upsert songs
  const songIdMap = new Map(); // key: `${title}|||${artist}` -> _id
  for (const s of songsSeed) {
    const key = `${s.title}|||${s.artist}`;
    const existing = await Song.findOne({ title: s.title, artist: s.artist });
    if (existing) {
      // optional: update URLs/duration if changed
      existing.imageUrl = s.imageUrl;
      existing.audioUrl = s.audioUrl;
      existing.duration = s.duration;
      await existing.save();
      songIdMap.set(key, existing._id);
    } else {
      const created = await Song.create(s);
      songIdMap.set(key, created._id);
    }
  }

  // 2) Upsert albums and link songs
  for (const a of albumsSeed) {
    const [start, end] = a.songRange;
    const pick = songsSeed.slice(start, end).map((s) => songIdMap.get(`${s.title}|||${s.artist}`)).filter(Boolean);

    let album = await Album.findOne({ title: a.title, artist: a.artist });
    if (!album) {
      album = await Album.create({ title: a.title, artist: a.artist, imageUrl: a.imageUrl, releaseYear: a.releaseYear, songs: pick });
    } else {
      album.imageUrl = a.imageUrl;
      album.releaseYear = a.releaseYear;
      album.songs = pick;
      await album.save();
    }

    // backfill each song's albumId
    await Song.updateMany({ _id: { $in: pick } }, { $set: { albumId: album._id } });
  }

  console.log("✅ Safe seed finished (no deletes).");
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
