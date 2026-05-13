const { connectDB, Rental } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    // vercel.json rewrites /api/rentals/:id → /api/rentals?id=:id
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const rental = await Rental.findById(id);
        if (!rental) return res.status(404).json({ error: "Not found" });
        return res.json(rental);
      }
      if (req.method === "PUT" || req.method === "PATCH") {
        const rental = await Rental.findByIdAndUpdate(id, req.body, { new: true });
        if (!rental) return res.status(404).json({ error: "Not found" });
        return res.json(rental);
      }
      if (req.method === "DELETE") {
        await Rental.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const rentals = await Rental.find().sort({ createdAt: 1 });
      return res.json(rentals);
    }

    if (req.method === "POST") {
      const rental = await Rental.create(req.body);
      return res.json(rental);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Rentals error:", err);
    res.status(500).json({ error: err.message });
  }
};
