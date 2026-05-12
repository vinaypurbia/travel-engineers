const { connectDB, Agency } = require("./_db");
const mongoose = require("mongoose");

// ─── TourBooking Schema ───────────────────────────────────────────────────────
const TourBookingSchema = new mongoose.Schema({
  tourId:        { type: String, required: true },
  tourTitle:     { type: String, required: true },
  tourType:      String,
  customerName:  { type: String, required: true },
  phone:         { type: String, required: true },
  email:         String,
  travelDate:    Date,
  pax:           { type: Number, default: 1 },
  pickupPoint:   String,
  flightNumber:  String,   // for airport transfers
  notes:         String,
  // Pricing (admin can adjust from base)
  basePrice:     { type: Number, default: 0 },
  finalPrice:    { type: Number, default: 0 },  // admin-adjustable
  tokenAmount:   { type: Number, default: 0 },  // 50% advance requested
  receivedAmount:{ type: Number, default: 0 },
  // Status flow: pending → confirmed → completed / cancelled
  status:        { type: String, enum: ["pending","confirmed","completed","cancelled"], default: "pending" },
  paymentStatus: { type: String, enum: ["unpaid","partial","paid"], default: "unpaid" },
  adminNotes:    String,
}, { timestamps: true });

const TourBooking = mongoose.models.TourBooking || mongoose.model("TourBooking", TourBookingSchema);

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendTourEmail({ booking, agencyEmail, agencyName }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  if (!gmailUser || !gmailPass) return;
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
    const typeEmoji = { "day-trip":"🌅","multi-day":"🏕️","taxi":"🚗","airport":"✈️" };
    const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#d4850a;padding:24px 28px;border-radius:12px 12px 0 0">
        <h2 style="color:white;margin:0">${typeEmoji[booking.tourType]||"🗺️"} New Tour Booking Request</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${agencyName}</p>
      </div>
      <div style="padding:24px 28px;background:white;border-radius:0 0 12px 12px;border:1px solid #eee">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#888;width:140px">Tour</td><td style="padding:8px 0;font-weight:600">${booking.tourTitle}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0;font-weight:600">${booking.customerName}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">${booking.phone}</td></tr>
          ${booking.email ? `<tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0">${booking.email}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#888">Travel Date</td><td style="padding:8px 0">${fmt(booking.travelDate)}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Pax</td><td style="padding:8px 0">${booking.pax} person${booking.pax>1?"s":""}</td></tr>
          ${booking.pickupPoint ? `<tr><td style="padding:8px 0;color:#888">Pickup</td><td style="padding:8px 0">${booking.pickupPoint}</td></tr>` : ""}
          ${booking.flightNumber ? `<tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Flight No.</td><td style="padding:8px 0">${booking.flightNumber}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#888">Package Price</td><td style="padding:8px 0;font-weight:600;color:#d4850a">₹${(booking.basePrice||0).toLocaleString("en-IN")}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Advance Requested</td><td style="padding:8px 0;font-weight:600">₹${(booking.tokenAmount||0).toLocaleString("en-IN")}</td></tr>
          ${booking.notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0">${booking.notes}</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;padding:12px 16px;background:#fff8ec;border-left:3px solid #d4850a;border-radius:4px;font-size:12px;color:#888">
          Booking ID: ${booking._id}
        </div>
      </div>
    </div>`;
    await transporter.sendMail({
      from: `"${agencyName}" <${gmailUser}>`,
      to: agencyEmail || gmailUser,
      subject: `🗺️ New Tour Request — ${booking.tourTitle} by ${booking.customerName}`,
      html,
    });
  } catch (err) {
    console.error("Tour email error:", err.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();
    const id = req.query?.id || null;

    if (id) {
      if (req.method === "GET") {
        const b = await TourBooking.findById(id);
        if (!b) return res.status(404).json({ error: "Not found" });
        return res.json(b);
      }
      if (req.method === "PUT") {
        const b = await TourBooking.findByIdAndUpdate(id, req.body, { new: true });
        if (!b) return res.status(404).json({ error: "Not found" });
        return res.json(b);
      }
      if (req.method === "DELETE") {
        await TourBooking.findByIdAndDelete(id);
        return res.json({ success: true });
      }
    }

    if (req.method === "GET") {
      const bookings = await TourBooking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    if (req.method === "POST") {
      const {
        tourId, tourTitle, tourType, customerName, phone, email,
        travelDate, pax, pickupPoint, flightNumber, notes, basePrice,
      } = req.body;

      const finalPrice  = basePrice || 0;
      const tokenAmount = finalPrice > 0 ? Math.ceil(finalPrice * 0.5) : 0;

      const booking = await TourBooking.create({
        tourId, tourTitle, tourType, customerName, phone, email,
        travelDate: travelDate ? new Date(travelDate) : null,
        pax: Number(pax) || 1,
        pickupPoint, flightNumber, notes,
        basePrice: finalPrice, finalPrice, tokenAmount,
        status: "pending", paymentStatus: "unpaid",
      });

      // WhatsApp message for admin
      const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
      const typeEmoji = { "day-trip":"🌅","multi-day":"🏕️","taxi":"🚗","airport":"✈️" };
      const msg = [
        `${typeEmoji[tourType]||"🗺️"} *New Tour Booking Request!*`, ``,
        `*Tour:* ${tourTitle}`, `*Customer:* ${customerName}`, `*Phone:* ${phone}`,
        `*Travel Date:* ${fmt(travelDate)}`, `*Pax:* ${pax} person${pax>1?"s":""}`,
        pickupPoint ? `*Pickup:* ${pickupPoint}` : null,
        flightNumber ? `*Flight:* ${flightNumber}` : null,
        `*Package Price:* ₹${finalPrice.toLocaleString("en-IN")}`,
        `*Advance Requested:* ₹${tokenAmount.toLocaleString("en-IN")}`,
        notes ? `*Notes:* ${notes}` : null, ``,
        `Booking ID: ${booking._id}`,
      ].filter(Boolean).join("\n");

      const whatsapp = (process.env.WHATSAPP_NUMBER || "919876543210").replace(/[^0-9]/g, "");
      const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

      let agency = null;
      try { agency = await Agency.findOne().lean(); } catch {}
      sendTourEmail({ booking, agencyEmail: agency?.email || process.env.GMAIL_USER, agencyName: agency?.name || "Travel Engineers" }).catch(console.error);

      return res.json({ success: true, booking, whatsappUrl });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Tour bookings error:", err);
    res.status(500).json({ error: err.message });
  }
};
