const { connectDB, Villa } = require("./_db");

const DEFAULT_VILLA = {
  name: "IslandDrift Villa",
  tagline: "Your Private Paradise",
  description: "A stunning 6-room villa with private pool.",
  price: "₹18,000", period: "/night",
  checkIn: "12:00 PM", checkOut: "11:00 AM",
  minStay: "2 nights", maxGuests: "14 guests",
  amenities: [
    { icon: "🏊", label: "Private Pool" },
    { icon: "🛏️", label: "6 Bedrooms" },
    { icon: "🍳", label: "Full Kitchen" },
    { icon: "📶", label: "WiFi" },
    { icon: "❄️", label: "AC" },
    { icon: "🔒", label: "Security" },
  ],
  rooms: [],
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      let villa = await Villa.findOne();
      if (!villa) villa = await Villa.create(DEFAULT_VILLA);
      return res.json(villa);
    }

    if (req.method === "PUT" || req.method === "POST") {
      let villa = await Villa.findOne();
      if (!villa) {
        villa = await Villa.create({ ...DEFAULT_VILLA, ...req.body });
      } else {
        Object.assign(villa, req.body);
        villa.markModified("amenities");
        villa.markModified("rooms");
        await villa.save();
      }
      return res.json(villa);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Villa error:", err);
    res.status(500).json({ error: err.message });
  }
};
