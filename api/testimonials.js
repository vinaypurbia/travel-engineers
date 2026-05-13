const { connectDB, Testimonial } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

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
      if (req.method === "PUT" || req.method === "PATCH") {
        const t = await Testimonial.findByIdAndUpdate(id, req.body, { new: true });
        if (!t) return res.status(404).json({ error: "Not found" });
        return res.json(t);
      }
      if (req.method === "DELETE") {
        await Testimonial.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const testimonials = await Testimonial.find().sort({ createdAt: -1 });
      return res.json(testimonials);
    }

    if (req.method === "POST") {
      const t = await Testimonial.create({ ...req.body, approved: req.body.approved ?? false });
      return res.json(t);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Testimonials error:", err);
    res.status(500).json({ error: err.message });
  }
};
