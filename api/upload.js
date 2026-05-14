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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const multerRun = () => new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    await multerRun();
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isSvg = req.file.mimetype === "image/svg+xml";
    const isPng = req.file.mimetype === "image/png";
    const isVideo = req.file.mimetype.startsWith("video/");

    const uploadOptions = {
      folder: "travel-agency",
      resource_type: isVideo ? "video" : "image",
      ...(isSvg && {
        // SVG: upload as raw file, preserve as-is
        resource_type: "raw",
        format: "svg",
      }),
      ...(isPng && {
        // PNG: force PNG format to preserve transparency
        format: "png",
        // Do NOT convert to jpg
      }),
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
};
