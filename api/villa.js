const { connectDB, Villa, verifyStaffToken } = require("./_db");

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET stays public — the public website's villa page reads this directly.
  // Only writes (PUT/POST, which overwrite the entire villa record) need
  // gating — previously this file had no auth at all.
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
  const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;
  const isAdminOrStaff = (r) => {
    if (isAdmin(r)) return true;
    const staff = verifyStaffToken(r.headers["x-staff-token"] || "");
    return !!staff && staff.permissions.includes("villa");
  };

  try {
    await connectDB();

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      let villa = await Villa.findOne().lean();
      if (!villa) villa = await Villa.create(DEFAULT_VILLA);
      return res.json(villa);
    }

    if (req.method === "PUT" || req.method === "POST") {
      if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
      const villa = await Villa.findOneAndUpdate(
        {},
        { $set: req.body },
        { new: true, upsert: true, runValidators: false }
      ).lean();
      return res.json(villa);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Villa error:", err);
    res.status(500).json({ error: err.message });
  }
};
