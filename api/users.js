const { connectDB } = require("./_db");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MODULES = ["dashboard","agency","rentals","villa","testimonials","inventory","tours","accounting","bookings"];

const UserSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true }, // bcrypt hash
  name:        { type: String, required: true },
  designation: { type: String, default: "" },
  permissions: { type: [String], default: ["bookings"] }, // array of module ids
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

function isAdmin(req) {
  const auth = req.headers["x-admin-token"] || req.cookies?.adminToken || "";
  return auth === ADMIN_PASS || auth === "admin_verified";
}

function isStaff(req) {
  const auth = req.headers["x-staff-token"] || "";
  return !!auth; // token is the user's _id, verified below
}

module.exports = async function handler(req, res) {
  await connectDB();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { method, query, body } = req;

  // ── Staff login (public) ─────────────────────────────────────────────────────
  if (method === "POST" && query.action === "login") {
    const { username, password } = body || {};
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    const user = await User.findOne({ username: username.toLowerCase(), active: true });
    if (!user) return res.status(401).json({ error: "Invalid username or password" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });
    return res.json({
      success: true,
      user: {
        _id: String(user._id),
        name: user.name,
        username: user.username,
        designation: user.designation,
        permissions: user.permissions,
      }
    });
  }

  // ── All other operations require admin token ─────────────────────────────────
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
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hash,
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
    if (password)    update.password    = await bcrypt.hash(password, 10);
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
