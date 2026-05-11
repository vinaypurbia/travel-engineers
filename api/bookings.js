const { connectDB, Booking, Agency } = require("./_db");
const nodemailer = require("nodemailer");

// ── Email sender ─────────────────────────────────────────────────────────────
async function sendBookingEmail({ booking, days, agencyEmail, agencyName }) {
  // Requires GMAIL_USER and GMAIL_PASS in Vercel env vars
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  if (!gmailUser || !gmailPass) return { sent: false, reason: "No email credentials" };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
      <div style="background:#d4850a;padding:24px 28px">
        <h2 style="color:white;margin:0;font-size:22px">🛵 New Booking Request</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${agencyName || "Travel Engineers"}</p>
      </div>
      <div style="padding:24px 28px;background:white">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#888;width:140px">Vehicle</td><td style="padding:8px 0;font-weight:600">${booking.vehicleName || "—"}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0;font-weight:600">${booking.customerName}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">${booking.phone}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${fmt(booking.checkIn)}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${fmt(booking.checkOut)}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Duration</td><td style="padding:8px 0">${days} day${days !== 1 ? "s" : ""}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Stay Address</td><td style="padding:8px 0">${booking.stayAddress || "—"}</td></tr>
          ${booking.notes ? `<tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0">${booking.notes}</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;padding:12px 16px;background:#fff8ec;border-left:3px solid #d4850a;border-radius:4px;font-size:12px;color:#888">
          Booking ID: ${booking._id}
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${agencyName || "Travel Engineers"}" <${gmailUser}>`,
    to: agencyEmail || gmailUser,
    subject: `🛵 New Booking — ${booking.vehicleName || "Vehicle"} by ${booking.customerName}`,
    html,
  });

  return { sent: true };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    const id = req.query?.id || null;

    // ── Single booking ───────────────────────────────────────────────────────
    if (id) {
      if (req.method === "GET") {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Not found" });
        return res.json(booking);
      }
      if (req.method === "PUT") {
        const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
        if (!booking) return res.status(404).json({ error: "Not found" });
        return res.json(booking);
      }
      if (req.method === "DELETE") {
        await Booking.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    // ── All bookings ─────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    // ── Create booking ───────────────────────────────────────────────────────
    if (req.method === "POST") {
      const { customerName, phone, vehicleName, vehicleId, checkIn, checkOut, stayAddress, notes } = req.body;

      const booking = await Booking.create({
        customerName, phone, vehicleName, vehicleId,
        checkIn:  checkIn  ? new Date(checkIn)  : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        stayAddress, notes,
        status: "pending",
      });

      const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
      const days = (checkIn && checkOut)
        ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5))
        : 1;

      // ── WhatsApp message ─────────────────────────────────────────────────
      const msg = [
        `🛵 *New Booking Request!*`,
        ``,
        `*Vehicle:* ${vehicleName || "—"}`,
        `*Customer:* ${customerName}`,
        `*Phone:* ${phone}`,
        `*Check-in:* ${fmt(checkIn)}`,
        `*Check-out:* ${fmt(checkOut)}`,
        `*Duration:* ${days} day${days !== 1 ? "s" : ""}`,
        `*Stay Address:* ${stayAddress || "—"}`,
        notes ? `*Notes:* ${notes}` : null,
        ``,
        `Booking ID: ${booking._id}`,
      ].filter(Boolean).join("\n");

      const whatsapp = process.env.WHATSAPP_NUMBER || "919876543210";
      const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

      // ── Send email notification ──────────────────────────────────────────
      let agency = null;
      try { agency = await Agency.findOne().lean(); } catch {}
      const emailResult = await sendBookingEmail({
        booking,
        days,
        agencyEmail: agency?.email || process.env.GMAIL_USER,
        agencyName:  agency?.name  || "Travel Engineers",
      }).catch(err => ({ sent: false, reason: err.message }));

      return res.json({
        success:      true,
        booking,
        whatsappUrl:  waUrl,
        emailSent:    emailResult.sent,
      });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Bookings error:", err);
    res.status(500).json({ error: err.message });
  }
};
