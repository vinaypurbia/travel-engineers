const { connectDB, Testimonial } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  await connectDB();

  if (req.method === "GET") {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    // Seed default if empty
    if (testimonials.length === 0) {
      await Testimonial.insertMany([
        { name: "Priya Sharma", location: "Mumbai", text: "The Enfield was in perfect condition and the villa was absolutely gorgeous!", rating: 5 },
        { name: "Rohan Mehta", location: "Bangalore", text: "Rented 3 scooties for our gang. Best decision ever! Delivery was on time.", rating: 5 },
        { name: "Sarah & James", location: "London", text: "Stayed at the villa for 4 nights. Six rooms, private pool — complete paradise!", rating: 5 },
      ]);
      return res.json(await Testimonial.find().sort({ createdAt: -1 }));
    }
    return res.json(testimonials);
  }

  if (req.method === "POST") {
    const t = await Testimonial.create(req.body);
    return res.json(t);
  }

  res.status(405).json({ error: "Method not allowed" });
};
