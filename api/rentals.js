const { connectDB, Rental, verifyStaffToken } = require("./_db");

// ── GPS live location (Traccar bridge) ─────────────────────────────────────
// Reads from a self-hosted Traccar server (free, open-source) configured via
// env vars: TRACCAR_URL, TRACCAR_USER, TRACCAR_PASSWORD.
// A Rental is "tracked" once its gpsDeviceId is set to the tracker's uniqueId
// (its IMEI, as registered in Traccar).
//   GET /api/rentals?action=location          -> all tracked vehicles
//   GET /api/rentals?action=location&id=<rentalId> -> just one vehicle
async function handleLocation(req, res) {
  const TRACCAR_URL  = (process.env.TRACCAR_URL || "").replace(/\/+$/, "");
  const TRACCAR_USER = process.env.TRACCAR_USER || "";
  const TRACCAR_PASS = process.env.TRACCAR_PASSWORD || "";
  if (!TRACCAR_URL || !TRACCAR_USER || !TRACCAR_PASS) {
    return res.status(500).json({ error: "GPS tracking isn't configured yet. Set TRACCAR_URL, TRACCAR_USER, TRACCAR_PASSWORD in your environment variables." });
  }

  const query = req.query?.id ? { _id: req.query.id } : { gpsDeviceId: { $exists: true, $ne: "" } };
  const trackedRentals = await Rental.find(query).lean();
  if (!trackedRentals.length) return res.json({ vehicles: [] });

  const auth = "Basic " + Buffer.from(`${TRACCAR_USER}:${TRACCAR_PASS}`).toString("base64");
  let devices, positions;
  try {
    const [devicesRes, positionsRes] = await Promise.all([
      fetch(`${TRACCAR_URL}/api/devices`,   { headers: { Authorization: auth } }),
      fetch(`${TRACCAR_URL}/api/positions`, { headers: { Authorization: auth } }),
    ]);
    if (!devicesRes.ok || !positionsRes.ok) {
      throw new Error(`Traccar responded ${devicesRes.status}/${positionsRes.status}`);
    }
    devices   = await devicesRes.json();
    positions = await positionsRes.json();
  } catch (err) {
    console.error("Traccar fetch error:", err);
    return res.status(502).json({ error: "Couldn't reach the GPS server: " + err.message });
  }

  const vehicles = trackedRentals
    .filter(r => r.gpsDeviceId)
    .map(r => {
      const device = devices.find(d => d.uniqueId === r.gpsDeviceId);
      const position = device ? positions.find(p => p.deviceId === device.id) : null;
      return {
        rentalId: r._id,
        name: r.name,
        vehicleNo: r.vehicleNo || "",
        gpsDeviceId: r.gpsDeviceId,
        online: device ? device.status === "online" : false,
        lat: position?.latitude ?? null,
        lng: position?.longitude ?? null,
        speedKmh: position?.speed != null ? Math.round(position.speed * 1.852) : null, // Traccar reports speed in knots
        course: position?.course ?? null,
        lastUpdate: position?.deviceTime || position?.fixTime || null,
      };
    });

  return res.json({ vehicles });
}

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

    // GPS live-location route — checked first so ?action=location&id=...
    // doesn't get swallowed by the plain id-lookup branch below.
    if (req.query?.action === "location") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
      return handleLocation(req, res);
    }

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
