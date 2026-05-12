const { connectDB } = require("./_db");
const mongoose = require("mongoose");

// ─── Tour Schema ──────────────────────────────────────────────────────────────
const TourSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  type:         { type: String, enum: ["day-trip","multi-day","taxi","airport"], default: "day-trip" },
  destinations: [String],
  description:  String,
  highlights:   [String],
  image:        String,
  gallery:      [String],
  duration:     String,   // e.g. "1 Day", "3 Days 2 Nights"
  basePrice:    { type: Number, default: 0 },
  priceLabel:   { type: String, default: "per package" },
  maxPax:       { type: Number, default: 6 },
  inclusions:   [String],
  exclusions:   [String],
  itinerary: [{
    day:         Number,
    title:       String,
    description: String,
    meals:       String,
    accommodation: String,
  }],
  pickupPoints: [String],
  available:    { type: Boolean, default: true },
  tag:          String,   // e.g. "Popular", "Best Value"
}, { timestamps: true });

const Tour = mongoose.models.Tour || mongoose.model("Tour", TourSchema);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const tour = await Tour.findById(id);
        if (!tour) return res.status(404).json({ error: "Not found" });
        return res.json(tour);
      }
      if (req.method === "PUT") {
        const tour = await Tour.findByIdAndUpdate(id, req.body, { new: true });
        if (!tour) return res.status(404).json({ error: "Not found" });
        return res.json(tour);
      }
      if (req.method === "DELETE") {
        await Tour.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const filter = {};
      if (req.query.type) filter.type = req.query.type;
      if (req.query.available === "true") filter.available = true;
      const tours = await Tour.find(filter).sort({ createdAt: -1 });
      return res.json(tours);
    }

    if (req.method === "POST") {
      const tour = await Tour.create(req.body);
      return res.json({ success: true, tour });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Tours error:", err);
    res.status(500).json({ error: err.message });
  }
};
