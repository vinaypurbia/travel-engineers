const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { connectDB, verifyStaffToken } = require("./_db");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Same convention as bookings.js etc. Used to gate the generic file-upload
// endpoint and the storage-stats endpoint — both are admin/staff actions,
// never public. (?action=chat stays public — that's the customer-facing
// chatbot widget, which by definition has no logged-in user.)
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;
const isAdminOrStaff = (r) => {
  if (isAdmin(r)) return true;
  const staff = verifyStaffToken(r.headers["x-staff-token"] || "");
  return !!staff && staff.permissions.length > 0; // any staff module is enough to upload images for their own work
};

// Optional: set MONGODB_STORAGE_LIMIT_MB in env vars if you're not on the
// 512MB Atlas M0 free tier. Defaults to 512MB.
const MONGO_LIMIT_BYTES = (Number(process.env.MONGODB_STORAGE_LIMIT_MB) || 512) * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "video/mp4", "video/quicktime"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not supported"), false);
  },
});

export const config = { api: { bodyParser: false } };

// ── Chat handler (Gemini AI) ───────────────────────────────────────────────
async function handleChat(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const { messages = [], system = "" } = req.body || {};
  if (!messages.length) return res.status(400).json({ error: "No messages provided" });

  // Build Gemini contents array
  // Gemini doesn't have a system role — prepend it as a user/model pair
  const contents = [];
  if (system) {
    contents.push({ role: "user",  parts: [{ text: system }] });
    contents.push({ role: "model", parts: [{ text: "Understood! I'm ready to help as the Travel Engineers assistant." }] });
  }
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("Gemini error:", data.error);
      return res.status(500).json({ error: data.error.message || "Gemini API error" });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || "I'm not sure how to answer that. Please WhatsApp us directly for help!";

    return res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

// ── Upload handler (Cloudinary) ────────────────────────────────────────────
async function handleUpload(req, res) {
  const multerRun = () => new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    await multerRun();
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isSvg   = req.file.mimetype === "image/svg+xml";
    const isPng   = req.file.mimetype === "image/png";
    const isVideo = req.file.mimetype.startsWith("video/");

    const uploadOptions = {
      folder: "travel-agency",
      resource_type: isVideo ? "video" : "image",
      ...(isSvg && { resource_type: "raw", format: "svg" }),
      ...(isPng  && { format: "png" }),
    };

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => { if (error) reject(error); else resolve(result); }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
}

// ── Storage usage handler (Cloudinary + MongoDB) ──────────────────────────
// Piggybacks on this function (rather than a new api file) to stay within
// Vercel's Serverless Function limit. Called as GET /api/upload?action=storage
async function handleStorage(req, res) {
  const result = { cloudinary: null, mongodb: null, cloudinaryError: null, mongodbError: null };

  try {
    const usage = await cloudinary.api.usage();
    result.cloudinary = {
      plan: usage.plan || null,
      storageBytes: usage.storage?.usage ?? 0,
      storageLimitBytes: usage.storage?.limit ?? null,
      bandwidthBytes: usage.bandwidth?.usage ?? 0,
      bandwidthLimitBytes: usage.bandwidth?.limit ?? null,
      objects: usage.objects?.usage ?? null,
      derivedResources: usage.derived_resources ?? null,
      transformations: usage.transformations?.usage ?? null,
      requests: usage.requests ?? null,
      credits: usage.credits ? { usage: usage.credits.usage, limit: usage.credits.limit } : null,
      lastUpdated: usage.last_updated || null,
    };
  } catch (err) {
    console.error("Cloudinary usage error:", err);
    result.cloudinaryError = err.message || "Failed to fetch Cloudinary usage";
  }

  try {
    const conn = await connectDB();
    const stats = await conn.connection.db.stats();
    result.mongodb = {
      dbName: stats.db,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      collections: stats.collections,
      indexes: stats.indexes,
      objects: stats.objects,
      limitBytes: MONGO_LIMIT_BYTES,
    };
  } catch (err) {
    console.error("MongoDB stats error:", err);
    result.mongodbError = err.message || "Failed to fetch MongoDB stats";
  }

  return res.json(result);
}

// ── Main handler — routes by ?action= query param ─────────────────────────
// Usage:
//   POST /api/upload              → file upload (default, backward compatible)
//   POST /api/upload?action=chat  → AI chat via Gemini
//   GET  /api/upload?action=storage → Cloudinary + MongoDB usage stats
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.query.action === "storage") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    // Previously ungated — anyone could read your Cloudinary/MongoDB usage
    // stats even though the frontend always sent an admin token.
    if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
    return handleStorage(req, res);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Route to chat handler if ?action=chat — stays public, this is the
  // customer-facing chatbot widget with no logged-in user.
  if (req.query.action === "chat") {
    // Chat needs JSON body — parse it manually since bodyParser is false
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = JSON.parse(Buffer.concat(chunks).toString());
    return handleChat(req, res);
  }

  // Default → generic file upload. This was previously fully public (no
  // caller of it was found going through the admin-authenticated `api`
  // helper), meaning anyone could upload arbitrary files to your Cloudinary
  // account on your bill. Gate it — if a legitimate public flow needs file
  // upload, it should go through bookings.js's scan_id route (which already
  // handles ID images) rather than this generic endpoint.
  if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
  return handleUpload(req, res);
};
