const { connectDB, Rental, Inventory, Villa, Booking } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const item = await Inventory.findById(id);
        if (!item) return res.status(404).json({ error: "Not found" });
        return res.json(item);
      }
      if (req.method === "PUT" || req.method === "PATCH") {
        const item = await Inventory.findByIdAndUpdate(
          id, { ...req.body, updatedAt: new Date() }, { new: true }
        );
        if (!item) return res.status(404).json({ error: "Not found" });
        return res.json(item);
      }
      if (req.method === "DELETE") {
        await Inventory.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [rentals, standaloneItems, villa, activeBookings] = await Promise.all([
        Rental.find().sort({ createdAt: 1 }),
        Inventory.find().sort({ createdAt: -1 }),
        Villa.findOne(),
        // Get all active/confirmed bookings that overlap with today or future
        Booking.find({
          status: { $in: ["pending", "confirmed", "payment_requested"] },
          checkOut: { $gte: today },
        }),
      ]);

      // Build a map of vehicleId → bookings for quick lookup
      const bookedVehicleMap = {};
      activeBookings.forEach(b => {
        if (b.vehicleId) {
          const vid = String(b.vehicleId);
          if (!bookedVehicleMap[vid]) bookedVehicleMap[vid] = [];
          bookedVehicleMap[vid].push({
            from: b.checkIn,
            to: b.checkOut,
            customerName: b.customerName,
            bookingId: String(b._id),
            status: b.status,
          });
        }
      });

      // Rentals → vehicle inventory with real booking status
      const rentalItems = rentals.map(r => {
        const vid = String(r._id);
        const bookings = bookedVehicleMap[vid] || [];
        // Check if booked right now (today falls between checkIn and checkOut)
        const isBookedNow = bookings.some(b => {
          const from = b.from ? new Date(b.from) : null;
          const to   = b.to   ? new Date(b.to)   : null;
          return from && to && today >= from && today <= to;
        });
        // Check if booked in future
        const hasUpcomingBooking = bookings.length > 0;

        return {
          _id: r._id,
          type: "vehicle",
          vehicleType: r.type,
          name: r.name,
          description: r.description || "",
          status: !r.available ? "maintenance" : isBookedNow ? "booked" : "available",
          pricePerDay: parseFloat((r.price || "0").replace(/[^\d.]/g, "")) || 0,
          currency: "INR",
          capacity: 2,
          location: "",
          image: r.image || "",
          notes: r.tag || "",
          features: r.features || [],
          isRental: true,
          activeBookings: bookings,
          hasUpcomingBooking,
          createdAt: r.createdAt,
        };
      });

      // Villa rooms → room inventory items
      const roomItems = villa && villa.rooms ? villa.rooms.map((room, idx) => ({
        _id: `room_${idx}`,
        type: "room",
        name: room.name || `Room ${idx + 1}`,
        description: `${room.beds || ""} · up to ${room.guests || 1} guests`,
        status: room.status || "available",
        pricePerDay: 0,
        currency: "INR",
        capacity: room.guests || 1,
        location: "Villa",
        image: room.image || "",
        notes: room.beds || "",
        isRoom: true,
        roomIndex: idx,
        createdAt: new Date(),
      })) : [];

      const combined = [
        ...rentalItems,
        ...roomItems,
        ...standaloneItems.filter(i => i.type !== "vehicle"),
      ];

      return res.json(combined);
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
