const { connectDB, Rental } = require("../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();
    const { id } = req.query;

    if (req.method === "PUT") {
      const rental = await Rental.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(rental);
    }

    if (req.method === "DELETE") {
      await Rental.findByIdAndDelete(id);
      return res.json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Rental ID error:", err);
    res.status(500).json({ error: err.message });
  }
};
