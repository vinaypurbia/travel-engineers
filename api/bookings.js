const { connectDB, Booking } = require("./_db");

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
      const { customerName, phone, vehicleName, vehicleId, checkIn, checkOut, stayAddress, notes } = req.body;

      // Save to DB
      const booking = await Booking.create({
        customerName, phone, vehicleName, vehicleId,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        stayAddress, notes,
        status: "pending",
      });

      // Build WhatsApp message
      const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
      const days = (checkIn && checkOut)
        ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5))
        : "?";

      const msg = [
        `🛵 *New Booking Request!*`,
        ``,
        `*Vehicle:* ${vehicleName || "—"}`,
        `*Customer:* ${customerName}`,
        `*Phone:* ${phone}`,
        `*Check-in:* ${fmt(checkIn)}`,
        `*Check-out:* ${fmt(checkOut)}`,
        `*Duration:* ${days} day${days !== 1 ? "s" : ""}`,
        `*Stay Address:* ${stayAddress || "—"}`,
        notes ? `*Notes:* ${notes}` : null,
        ``,
        `Booking ID: ${booking._id}`,
      ].filter(Boolean).join("\n");

      // WhatsApp deep link — use your number from env or hardcode fallback
      const whatsapp = process.env.WHATSAPP_NUMBER || "919876543210";
      const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

      return res.json({ success: true, booking, whatsappUrl: waUrl });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Bookings error:", err);
    res.status(500).json({ error: err.message });
  }
};
