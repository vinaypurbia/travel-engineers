const { connectDB, Inventory } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      // Optional filter by type: ?type=vehicle
      const filter = {};
      if (req.query && req.query.type) filter.type = req.query.type;
      if (req.query && req.query.status) filter.status = req.query.status;
      const items = await Inventory.find(filter).sort({ createdAt: -1 });
      return res.json(items);
    }

    if (req.method === "POST") {
      const item = await Inventory.create({
        ...req.body,
        updatedAt: new Date(),
      });
      return res.json(item);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};
