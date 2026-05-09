module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { password } = req.body;
      const adminPass = process.env.ADMIN_PASSWORD || "admin123";
      if (password === adminPass) {
        return res.json({ success: true });
      }
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: err.message });
  }
};
