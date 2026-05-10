const { connectDB, Inventory } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    // vercel.json rewrites /api/inventory/:id → /api/inventory.js?id=:id
    const id = req.query?.id || null;

    if (id) {
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
    }

    // Collection routes
    if (req.method === "GET") {
      const filter = {};
      if (req.query?.type)   filter.type   = req.query.type;
      if (req.query?.status) filter.status = req.query.status;
      const items = await Inventory.find(filter).sort({ createdAt: -1 });
      return res.json(items);
    }

    if (req.method === "POST") {
      const item = await Inventory.create({ ...req.body, updatedAt: new Date() });
      return res.json(item);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};
