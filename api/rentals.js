const { connectDB, Rental, verifyStaffToken } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
  const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;
  // Staff with the "rentals" permission (assigned in the Users tab) can
  // manage rentals same as admin — their token is signed at login (see
  // users.js ?action=login) and carries their permissions, verified here
  // without a DB lookup.
  const isAdminOrStaff = (r) => {
    if (isAdmin(r)) return true;
    const staff = verifyStaffToken(r.headers["x-staff-token"] || "");
    return !!staff && staff.permissions.includes("rentals");
  };

  try {
    await connectDB();

    // vercel.json rewrites /api/rentals/:id → /api/rentals?id=:id
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const rental = await Rental.findById(id);
        if (!rental) return res.status(404).json({ error: "Not found" });
        return res.json(rental);
      }
      if (req.method === "PUT" || req.method === "PATCH") {
        if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
        const rental = await Rental.findByIdAndUpdate(id, req.body, { new: true });
        if (!rental) return res.status(404).json({ error: "Not found" });
        return res.json(rental);
      }
      if (req.method === "DELETE") {
        if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
        await Rental.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const rentals = await Rental.find().sort({ createdAt: 1 });
      return res.json(rentals);
    }

    if (req.method === "POST") {
      if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
      const rental = await Rental.create(req.body);
      return res.json(rental);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Rentals error:", err);
    res.status(500).json({ error: err.message });
  }
};
