const { connectDB, Booking } = require("../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    if (req.method === "POST") {
      const booking = await Booking.create({ ...req.body, status: "pending" });
      return res.json({ success: true, booking });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
