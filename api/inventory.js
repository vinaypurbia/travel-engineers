const { connectDB, Rental, Inventory } = require("./_db");

// Inventory is a unified view:
// - All Rentals (vehicles) are shown as inventory items automatically
// - Plus any standalone Inventory items (tours, equipment, villa)
// No redundancy — rentals ARE the vehicle inventory

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    const id = req.query?.id || null;

    // ── Single item routes (standalone inventory only) ──────────────────────
    if (id) {
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

    // ── GET: merge Rentals + standalone Inventory ───────────────────────────
    if (req.method === "GET") {
      const [rentals, standaloneItems] = await Promise.all([
        Rental.find().sort({ createdAt: 1 }),
        Inventory.find().sort({ createdAt: -1 }),
      ]);

      // Map rentals into inventory shape
      const rentalItems = rentals.map(r => ({
        _id: r._id,
        type: "vehicle",
        vehicleType: r.type,        // scooty | bike | car
        name: r.name,
        description: r.description || "",
        status: r.available ? "available" : "booked",
        pricePerDay: parseFloat((r.price || "0").replace(/[^\d.]/g, "")) || 0,
        currency: "INR",
        capacity: 1,
        location: "",
        image: r.image || "",
        notes: r.tag || "",
        features: r.features || [],
        isRental: true,             // flag so UI knows it came from rentals
        createdAt: r.createdAt,
      }));

      // Combine: rentals first, then standalone non-vehicle items
      const combined = [
        ...rentalItems,
        ...standaloneItems.filter(i => i.type !== "vehicle"),
      ];

      return res.json(combined);
    }

    // ── POST: create standalone inventory item (tours, equipment etc.) ──────
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
