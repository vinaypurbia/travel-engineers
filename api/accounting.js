const { connectDB, Transaction } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    // vercel.json rewrites /api/accounting/:id → /api/accounting.js?id=:id
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const tx = await Transaction.findById(id);
        if (!tx) return res.status(404).json({ error: "Not found" });
        return res.json(tx);
      }
      if (req.method === "PUT" || req.method === "PATCH") {
        const tx = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
        if (!tx) return res.status(404).json({ error: "Not found" });
        return res.json(tx);
      }
      if (req.method === "DELETE") {
        await Transaction.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    // Collection routes
    if (req.method === "GET") {
      const filter = {};
      if (req.query?.type)          filter.type          = req.query.type;
      if (req.query?.category)      filter.category      = req.query.category;
      if (req.query?.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
      if (req.query?.from || req.query?.to) {
        filter.date = {};
        if (req.query.from) filter.date.$gte = new Date(req.query.from);
        if (req.query.to)   filter.date.$lte = new Date(req.query.to);
      }
      const transactions = await Transaction.find(filter).sort({ date: -1 });
      const totalIncome  = transactions.filter(t => t.type === "income") .reduce((s,t) => s + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
      const netProfit    = totalIncome - totalExpense;
      const breakdown    = {};
      transactions.filter(t => t.type === "income").forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });
      return res.json({
        transactions,
        summary: { totalIncome, totalExpense, netProfit, breakdown, count: transactions.length },
      });
    }

    if (req.method === "POST") {
      const tx = await Transaction.create(req.body);
      return res.json(tx);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Accounting error:", err);
    res.status(500).json({ error: err.message });
  }
};
