const { connectDB, Agency } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      let agency = await Agency.findOne();
      if (!agency) agency = await Agency.create({});
      return res.json(agency);
    }

    if (req.method === "PUT" || req.method === "POST") {
      let agency = await Agency.findOne();
      if (!agency) {
        agency = await Agency.create(req.body);
      } else {
        Object.assign(agency, req.body);
        await agency.save();
      }
      return res.json(agency);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Agency error:", err);
    res.status(500).json({ error: err.message });
  }
};
