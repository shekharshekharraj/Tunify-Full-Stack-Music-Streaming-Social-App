// backend/src/controller/admin.controller.js
import { clerkClient } from "@clerk/express";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";

/** Extract email from Clerk claims (handles multiple possible shapes) */
const getEmailFromClaims = (req) => {
  const claims = req.auth?.sessionClaims || req.auth?.claims || {};
  const direct =
    (typeof claims.email === "string" && claims.email) ||
    (typeof claims.email_address === "string" && claims.email_address) ||
    (typeof claims.primary_email_address === "string" && claims.primary_email_address);

  const arr = claims.emailAddresses || claims.email_addresses || claims.emails || [];
  let fromArray = "";
  if (Array.isArray(arr) && arr.length) {
    const first = arr[0];
    fromArray =
      (typeof first === "string" && first) ||
      (typeof first?.email_address === "string" && first.email_address) ||
      (typeof first?.emailAddress === "string" && first.emailAddress) ||
      "";
  }

  const nested =
    claims.user?.primaryEmailAddress?.emailAddress ||
    claims.user?.emailAddress ||
    "";

  return String(direct || fromArray || nested || "").trim().toLowerCase();
};

/** Resolve the current user's email, falling back to Clerk API if missing in claims */
const resolveEmail = async (req) => {
  const fromClaims = getEmailFromClaims(req);
  if (fromClaims) return fromClaims;

  const clerkId = req.auth?.userId;
  if (!clerkId) return "";

  try {
    const user = await clerkClient.users.getUser(clerkId);
    return (
      user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() ||
      ""
    );
  } catch {
    return "";
  }
};

/** GET /api/admin/is-admin — signed-in probe used by Topbar */
export const isAdmin = async (req, res) => {
  const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const envId    = (process.env.ADMIN_CLERK_ID || "").trim();

  const clerkId  = (req.auth?.userId || req.auth?.claims?.sub || "").trim();
  let email      = getEmailFromClaims(req);

  let ok = false;

  // 1) Direct Clerk ID match (fast path)
  if (envId && clerkId && clerkId === envId) {
    ok = true;
  } else if (envEmail) {
    // 2) Email match: if claims don't have it, fetch from Clerk
    if (!email) email = await resolveEmail(req);
    ok = !!email && email === envEmail;
  }

  // In dev, include helpful debug
  if (process.env.NODE_ENV !== "production") {
    return res.json({
      isAdmin: ok,
      debug: { envEmail, envId, clerkId, emailFromClaims: email },
    });
  }
  res.json({ isAdmin: ok });
};

/** Cloudinary upload helper */
const uploadToCloudinary = async (file) => {
  try {
    if (!file?.tempFilePath) throw new Error("Missing temp file");
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Error in uploadToCloudinary", error);
    throw new Error("Error uploading to Cloudinary");
  }
};

export const createSong = async (req, res, next) => {
  try {
    if (!req.files?.audioFile || !req.files?.imageFile) {
      return res.status(400).json({ message: "Please upload audioFile and imageFile" });
    }

    const { title, artist, albumId, duration, lyrics } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ message: "Title and artist are required" });
    }

    const audioUrl = await uploadToCloudinary(req.files.audioFile);
    const imageUrl = await uploadToCloudinary(req.files.imageFile);

    const parsedDuration = Number(duration);
    const song = await Song.create({
      title,
      artist,
      audioUrl,
      imageUrl,
      duration: Number.isFinite(parsedDuration) ? parsedDuration : 0,
      albumId: albumId === "none" ? null : albumId || null,
      lyrics: lyrics || "",
    });

    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, { $addToSet: { songs: song._id } });
    }

    res.status(201).json(song);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Error in createSong", error);
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, { $pull: { songs: song._id } });
    }
    await Song.findByIdAndDelete(id);

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Error in deleteSong", error);
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    const { title, artist, releaseYear } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ message: "Title and artist are required" });
    }
    if (!req.files?.imageFile) {
      return res.status(400).json({ message: "Please upload imageFile" });
    }

    const imageUrl = await uploadToCloudinary(req.files.imageFile);
    const album = await Album.create({
      title,
      artist,
      imageUrl,
      releaseYear: releaseYear ? Number(releaseYear) : undefined,
    });

    res.status(201).json(album);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Error in createAlbum", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Song.deleteMany({ albumId: id });
    await Album.findByIdAndDelete(id);
    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Error in deleteAlbum", error);
    next(error);
  }
};

/** Protected by requireAdmin upstream — if this runs, caller is admin */
export const checkAdmin = async (_req, res) => {
  res.status(200).json({ admin: true });
};
