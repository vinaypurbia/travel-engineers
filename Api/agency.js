const { connectDB, Agency } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  await connectDB();

  if (req.method === "GET") {
    let agency = await Agency.findOne();
    if (!agency) agency = await Agency.create({});
    return res.json(agency);
  }

  if (req.method === "PUT") {
    let agency = await Agency.findOne();
    if (!agency) agency = new Agency();
    Object.assign(agency, req.body);
    await agency.save();
    return res.json(agency);
  }

  res.status(405).json({ error: "Method not allowed" });
};
