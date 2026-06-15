const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// ── Main handler — routes by ?action= query param ─────────────────────────
// Usage:
//   POST /api/upload           → file upload (default, backward compatible)
//   POST /api/upload?action=chat → AI chat via Gemini
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Route to chat handler if ?action=chat
  if (req.query.action === "chat") {
    // Chat needs JSON body — parse it manually since bodyParser is false
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = JSON.parse(Buffer.concat(chunks).toString());
    return handleChat(req, res);
  }

  // Default → file upload
  return handleUpload(req, res);
};
