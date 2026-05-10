const { connectDB, Booking } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    // Extract ID from URL if present: /api/bookings/123
    const urlParts = req.url.split("?")[0].split("/").filter(Boolean);
    const id = urlParts[urlParts.length - 1] !== "bookings" ? urlParts[urlParts.length - 1] : null;

    // ── Single booking by ID ─────────────────────────────────────────────────
    if (id) {
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
    }

    // ── All bookings ─────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    if (req.method === "POST") {
      const { customerName, phone, vehicleName, vehicleId, checkIn, checkOut, stayAddress, notes } = req.body;

      const booking = await Booking.create({
        customerName, phone, vehicleName, vehicleId,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        stayAddress, notes,
        status: "pending",
      });

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
