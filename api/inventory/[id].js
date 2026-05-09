const { connectDB, Inventory } = require("../../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "GET") {
      const item = await Inventory.findById(id);
      if (!item) return res.status(404).json({ error: "Not found" });
      return res.json(item);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const item = await Inventory.findByIdAndUpdate(
        id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!item) return res.status(404).json({ error: "Not found" });
      return res.json(item);
    }

    if (req.method === "DELETE") {
      await Inventory.findByIdAndDelete(id);
      return res.json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Inventory [id] error:", err);
    res.status(500).json({ error: err.message });
  }
};
