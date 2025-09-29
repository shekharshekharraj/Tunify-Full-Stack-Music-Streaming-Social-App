import { Router } from "express";
import { Party } from "../models/party.model.js";
import { nanoid } from "nanoid";

const router = Router();

// Create a party (host becomes leader)
router.post("/create", async (req, res) => {
  const hostUserId = req.auth?.userId || req.user?.id || "anon";
  const code = nanoid(6);
  const party = await Party.create({ hostUserId, code });
  res.json({ ok: true, party: { id: String(party._id), code: party.code } });
});

// Lookup party by join code
router.get("/by-code/:code", async (req, res) => {
  const party = await Party.findOne({ code: req.params.code, isActive: true }).lean();
  if (!party) return res.status(404).json({ ok: false, message: "Party not found" });
  res.json({ ok: true, party: { id: String(party._id), code: party.code } });
});

// End a party
router.post("/:id/end", async (req, res) => {
  await Party.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ ok: true });
});

export default router;
