const { connectDB, Agency, verifyStaffToken } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET stays public — the public website reads agency name/phone/address/
  // whatsapp from here for its header/footer/contact section. Only writes
  // (PUT/POST, which overwrite the entire agency record) need gating —
  // previously this file had no auth at all, so anyone could overwrite your
  // company info.
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
  const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;
  const isAdminOrStaff = (r) => {
    if (isAdmin(r)) return true;
    const staff = verifyStaffToken(r.headers["x-staff-token"] || "");
    return !!staff && staff.permissions.includes("agency");
  };

  try {
    await connectDB();

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      let agency = await Agency.findOne().lean();
      if (!agency) agency = await Agency.create({});
      return res.json(agency);
    }

    if (req.method === "PUT" || req.method === "POST") {
      if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
      const body = req.body;
      const agency = await Agency.findOneAndUpdate(
        {},
        { $set: body },
        { new: true, upsert: true, runValidators: false, strict: false }
      ).lean();
      return res.json(agency);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Agency error:", err);
    res.status(500).json({ error: err.message });
  }
};
