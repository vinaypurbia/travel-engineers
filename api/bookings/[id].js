const { connectDB, Booking } = require("../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "GET") {
      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ error: "Not found" });
      return res.json(booking);
    }

    if (req.method === "PUT") {
      const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
      if (!booking) return res.status(404).json({ error: "Not found" });
      return res.json(booking);
    }

    if (req.method === "DELETE") {
      await Booking.findByIdAndDelete(id);
      return res.json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Booking [id] error:", err);
    res.status(500).json({ error: err.message });
  }
};
