const { connectDB, signStaffToken } = require("./_db");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Same rate-limit approach as auth.js — applies here too since this file has
// its own two password-checking entry points (admin-token exchange, staff
// login) that are just as guessable if left unprotected.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record) return false;
  if (now - record.firstAttempt > WINDOW_MS) { attempts.delete(ip); return false; }
  return record.count >= MAX_ATTEMPTS;
}
function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now - record.firstAttempt > WINDOW_MS) attempts.set(ip, { count: 1, firstAttempt: now });
  else record.count++;
}
function clearAttempts(ip) { attempts.delete(ip); }

const MODULES = ["dashboard","agency","rentals","villa","testimonials","inventory","tours","accounting","bookings","newsletter"];

const UserSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true }, // sha256 hash
  name:        { type: String, required: true },
  designation: { type: String, default: "" },
  permissions: { type: [String], default: ["bookings"] },
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ADMIN_SECRET is ideally a private random string stored only in Vercel env vars,
// decoupled from the login password. If not set, falls back to ADMIN_PASSWORD itself
// (still works, just slightly less secure — set ADMIN_SECRET in Vercel when you can).
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";

function hash(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function isAdmin(req) {
  if (!ADMIN_SECRET) {
    console.error("ADMIN_SECRET env var is not set!");
    return false;
  }
  const auth = req.headers["x-admin-token"] || "";
  return auth === ADMIN_SECRET;
}

module.exports = async function handler(req, res) {
  await connectDB();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { method, query, body } = req;

  // ── Admin token exchange (public, called once after admin login) ────────
  // Frontend sends the admin login password, gets back ADMIN_SECRET.
  // ADMIN_SECRET is what's used for all subsequent admin API calls.
  if (method === "POST" && query.action === "admin-token") {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
    }
    const { password } = body || {};
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123"; // matches auth.js
    if (!password || password !== ADMIN_PASS) { recordFailedAttempt(ip); return res.status(403).json({ error: "Invalid password" }); }
    clearAttempts(ip);
    return res.json({ success: true, adminToken: ADMIN_SECRET });
  }

  // ── Staff login (public) ──────────────────────────────────────────────────
  if (method === "POST" && query.action === "login") {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
    }
    const { username, password } = body || {};
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    const user = await User.findOne({ username: username.toLowerCase(), active: true });
    if (!user) { recordFailedAttempt(ip); return res.status(401).json({ error: "Invalid username or password" }); }
    if (user.password !== hash(password)) { recordFailedAttempt(ip); return res.status(401).json({ error: "Invalid username or password" }); }
    clearAttempts(ip);
    // Sign a staff token scoped to this user's permissions, so every other
    // API route can verify "this is really a logged-in staff member, and
    // here's exactly what they're allowed to touch" — without ever handing
    // out the all-powerful admin token. Previously staff login returned only
    // the user object with no token at all, so every subsequent API call
    // from the staff panel had nothing valid to authenticate with and was
    // silently rejected (403) by every protected route.
    const staffToken = signStaffToken(String(user._id), user.permissions);
    return res.json({
      success: true,
      staffToken,
      user: {
        _id: String(user._id),
        name: user.name,
        username: user.username,
        designation: user.designation,
        permissions: user.permissions,
      }
    });
  }

  // ── All other operations require admin token ──────────────────────────────
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });

  // GET — list all users
  if (method === "GET") {
    const users = await User.find({}).sort({ createdAt: -1 }).select("-password");
    return res.json(users);
  }

  // POST — create user
  if (method === "POST") {
    const { username, password, name, designation, permissions } = body || {};
    if (!username || !password || !name) return res.status(400).json({ error: "username, password and name are required" });
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Username already taken" });
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hash(password),
      name: name.trim(),
      designation: (designation || "").trim(),
      permissions: Array.isArray(permissions) ? permissions.filter(p => MODULES.includes(p)) : ["bookings"],
    });
    const { password: _, ...safe } = user.toObject();
    return res.status(201).json(safe);
  }

  // PUT — update user
  if (method === "PUT") {
    const { id } = query;
    if (!id) return res.status(400).json({ error: "id required" });
    const { username, password, name, designation, permissions, active } = body || {};
    const update = {};
    if (name)        update.name        = name.trim();
    if (username)    update.username    = username.toLowerCase().trim();
    if (designation !== undefined) update.designation = designation.trim();
    if (Array.isArray(permissions)) update.permissions = permissions.filter(p => MODULES.includes(p));
    if (active !== undefined) update.active = active;
    if (password)    update.password    = hash(password);
    const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  }

  // DELETE — remove user
  if (method === "DELETE") {
    const { id } = query;
    if (!id) return res.status(400).json({ error: "id required" });
    await User.findByIdAndDelete(id);
    return res.json({ deleted: true });
  }

  res.status(405).json({ error: "Method not allowed" });
};
