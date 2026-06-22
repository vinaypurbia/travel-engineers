const { connectDB, Testimonial, verifyStaffToken } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-staff-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
  const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;
  const isAdminOrStaff = (r) => {
    if (isAdmin(r)) return true;
    const staff = verifyStaffToken(r.headers["x-staff-token"] || "");
    return !!staff && staff.permissions.includes("testimonials");
  };

  try {
    await connectDB();

    // vercel.json rewrites /api/testimonials/:id → /api/testimonials?id=:id
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const t = await Testimonial.findById(id);
        if (!t) return res.status(404).json({ error: "Not found" });
        return res.json(t);
      }
      // Editing/deleting a specific review (e.g. approve/reject, fix a typo,
      // remove spam) is an admin/staff moderation action — not public.
      if (req.method === "PUT" || req.method === "PATCH") {
        if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
        const t = await Testimonial.findByIdAndUpdate(id, req.body, { new: true });
        if (!t) return res.status(404).json({ error: "Not found" });
        return res.json(t);
      }
      if (req.method === "DELETE") {
        if (!isAdminOrStaff(req)) return res.status(403).json({ error: "Admin access required" });
        await Testimonial.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      // Public/unauthenticated requests only ever see APPROVED reviews — the
      // public website's reviews section used to rely on filtering this
      // client-side (testimonials.filter(t=>t.approved) in App.jsx), which
      // meant every visitor's browser actually received every unapproved/
      // pending review too, readable via dev tools. Admin/staff (with the
      // "testimonials" permission) still get everything, since moderation
      // requires seeing pending reviews.
      const authed = isAdminOrStaff(req);
      const filter = authed ? {} : { approved: true };
      const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
      return res.json(testimonials);
    }

    if (req.method === "POST") {
      // A new review submission is public by design (customers leaving
      // reviews don't log in), but it must always land as unapproved —
      // never let the submitter set approved:true themselves.
      const t = await Testimonial.create({ ...req.body, approved: false });
      return res.json(t);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Testimonials error:", err);
    res.status(500).json({ error: err.message });
  }
};
