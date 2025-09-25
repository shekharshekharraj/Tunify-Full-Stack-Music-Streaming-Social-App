// backend/src/middleware/auth.middleware.js
import { clerkClient } from "@clerk/express";

/** Safely read email from Clerk claims */
const getEmailFromClaims = (req) => {
  const claims = req.auth?.sessionClaims || req.auth?.claims || {};
  const email =
    (typeof claims.email === "string" && claims.email) ||
    (typeof claims.primary_email_address === "string" && claims.primary_email_address) ||
    (typeof claims.email_address === "string" && claims.email_address) ||
    "";
  return email.trim().toLowerCase();
};

export const protectRoute = (req, res, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in" });
  }
  next();
};

export const requireAdmin = async (req, res, next) => {
  try {
    const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envId    = (process.env.ADMIN_CLERK_ID || "").trim();

    const clerkId  = req.auth?.userId || "";
    let email = getEmailFromClaims(req);

    // If ID matches, you’re admin — fastest path.
    if (envId && clerkId === envId) return next();

    // Else, compare email; if claim missing, fetch from Clerk
    if (!email && envEmail && clerkId) {
      try {
        const user = await clerkClient.users.getUser(clerkId);
        email =
          user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() ||
          "";
      } catch (_) {
        // ignore, will fail below if still no match
      }
    }

    const ok = !!envEmail && !!email && email === envEmail;
    if (!ok) {
      return res.status(403).json({ message: "Unauthorized - admin only" });
    }
    next();
  } catch (err) {
    next(err);
  }
};
