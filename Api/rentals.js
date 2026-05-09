const { connectDB, Rental } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  await connectDB();

  // GET all
  if (req.method === "GET") {
    const rentals = await Rental.find().sort({ createdAt: 1 });
    return res.json(rentals);
  }

  // POST new
  if (req.method === "POST") {
    const rental = await Rental.create(req.body);
    return res.json(rental);
  }

  res.status(405).json({ error: "Method not allowed" });
};
