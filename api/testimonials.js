const { connectDB, Testimonial } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      let testimonials = await Testimonial.find().sort({ createdAt: -1 });
      if (testimonials.length === 0) {
        await Testimonial.insertMany([
          { name: "Priya Sharma", location: "Mumbai", text: "The villa was absolutely gorgeous. Pool was clean and staff super helpful!", rating: 5, approved: true },
          { name: "Rohan Mehta", location: "Bangalore", text: "Rented 3 scooties for our gang. Best decision ever!", rating: 5, approved: true },
          { name: "Sarah & James", location: "London", text: "4 nights in the villa — complete paradise!", rating: 5, approved: true },
        ]);
        testimonials = await Testimonial.find().sort({ createdAt: -1 });
      }
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
