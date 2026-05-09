const { connectDB, Testimonial } = require("../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();
    const { id } = req.query;

    if (req.method === "PUT" || req.method === "PATCH") {
      const t = await Testimonial.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: false }
      );
      if (!t) return res.status(404).json({ error: "Not found" });
      return res.json(t);
    }

    if (req.method === "DELETE") {
      await Testimonial.findByIdAndDelete(id);
      return res.json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Testimonial ID error:", err);
    res.status(500).json({ error: err.message });
  }
};
