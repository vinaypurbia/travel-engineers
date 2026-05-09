const { connectDB, Villa } = require("./_db");

const DEFAULT_VILLA = {
  name: "IslandDrift Villa",
  tagline: "Your Private Paradise",
  description: "A stunning 6-room villa with private pool, just 5 minutes from the beach.",
  price: "₹18,000", period: "/night",
  checkIn: "12:00 PM", checkOut: "11:00 AM",
  minStay: "2 nights", maxGuests: "14 guests",
  amenities: [
    { icon: "🏊", label: "Private Pool" },
    { icon: "🛏️", label: "6 Bedrooms" },
    { icon: "🍳", label: "Full Kitchen" },
    { icon: "📶", label: "High-Speed WiFi" },
    { icon: "❄️", label: "All Rooms AC" },
    { icon: "🔒", label: "24hr Security" },
  ],
  rooms: [
    { name: "Ocean Suite", beds: "King bed", guests: 2, image: "" },
    { name: "Garden Room", beds: "Queen bed", guests: 2, image: "" },
    { name: "Poolside Room", beds: "2 Twin beds", guests: 2, image: "" },
    { name: "Family Suite", beds: "King + 2 singles", guests: 4, image: "" },
    { name: "Sunset Loft", beds: "Queen bed", guests: 2, image: "" },
    { name: "Cozy Nook", beds: "Double bed", guests: 2, image: "" },
  ],
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  await connectDB();

  if (req.method === "GET") {
    let villa = await Villa.findOne();
    if (!villa) villa = await Villa.create(DEFAULT_VILLA);
    return res.json(villa);
  }

  if (req.method === "PUT") {
    let villa = await Villa.findOne();
    if (!villa) villa = new Villa();
    Object.assign(villa, req.body);
    await villa.save();
    return res.json(villa);
  }

  res.status(405).json({ error: "Method not allowed" });
};
