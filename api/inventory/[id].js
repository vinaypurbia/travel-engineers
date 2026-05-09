const { connectDB, Transaction } = require("../../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "GET") {
      const tx = await Transaction.findById(id);
      if (!tx) return res.status(404).json({ error: "Not found" });
      return res.json(tx);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const tx = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
      if (!tx) return res.status(404).json({ error: "Not found" });
      return res.json(tx);
    }

    if (req.method === "DELETE") {
      await Transaction.findByIdAndDelete(id);
      return res.json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Accounting [id] error:", err);
    res.status(500).json({ error: err.message });
  }
};
