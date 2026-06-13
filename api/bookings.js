const { connectDB, Booking, Agency, Customer } = require("./_db");

async function sendBookingEmail({ booking, days, agencyEmail, agencyName }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  if (!gmailUser || !gmailPass) return { sent: false, reason: "No email credentials" };
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
    const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#d4850a;padding:24px 28px;border-radius:12px 12px 0 0">
        <h2 style="color:white;margin:0">🛵 New Booking Request</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${agencyName || "Travel Engineers"}</p>
      </div>
      <div style="padding:24px 28px;background:white;border-radius:0 0 12px 12px;border:1px solid #eee">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#888;width:140px">Vehicle</td><td style="padding:8px 0;font-weight:600">${booking.vehicleName || "—"}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0;font-weight:600">${booking.customerName}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">${booking.phone}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${fmt(booking.checkIn)}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${fmt(booking.checkOut)}</td></tr>
          <tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Duration</td><td style="padding:8px 0">${days} day${days !== 1 ? "s" : ""}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Stay Address</td><td style="padding:8px 0">${booking.stayAddress || "—"}</td></tr>
          ${booking.idType ? `<tr style="background:#fafafa"><td style="padding:8px 0;color:#888">ID Type</td><td style="padding:8px 0">${booking.idType}</td></tr>` : ""}
          ${booking.idNumber ? `<tr><td style="padding:8px 0;color:#888">ID Number</td><td style="padding:8px 0">${booking.idNumber}</td></tr>` : ""}
          ${booking.notes ? `<tr style="background:#fafafa"><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0">${booking.notes}</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;padding:12px 16px;background:#fff8ec;border-left:3px solid #d4850a;border-radius:4px;font-size:12px;color:#888">
          Booking ID: ${booking._id} · Source: ${booking.source === "walkin" ? "Walk-in (Admin)" : "Online"}
        </div>
      </div>
    </div>`;
    await transporter.sendMail({
      from: `"${agencyName || "Travel Engineers"}" <${gmailUser}>`,
      to: agencyEmail || gmailUser,
      subject: `🛵 New Booking — ${booking.vehicleName || "Vehicle"} by ${booking.customerName}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

// ── Gemini Vision OCR ────────────────────────────────────────────────────────
// Uses Gemini 1.5 Flash (free tier, no billing required) to extract ID fields
async function scanWithGoogleVision(imageBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "GEMINI_API_KEY not set in Vercel env vars" };

  try {
    const prompt = `You are an ID document scanner. Extract all information from this ID document image.
Return ONLY a valid JSON object with these exact fields (use null if not found):
{
  "idType": "Aadhaar|PAN|Passport|Driving License|Voter ID|Emirates ID|Kuwait Civil ID|Other",
  "idNumber": "the document number",
  "fullName": "full name on document",
  "dateOfBirth": "YYYY-MM-DD format or null",
  "gender": "Male|Female|Other or null",
  "nationality": "nationality or null",
  "address": "full address if present or null",
  "expiryDate": "YYYY-MM-DD format or null"
}
Return only the JSON, no explanation, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }
            ]
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 512 }
        }),
      }
    );

    const data = await response.json();
    if (data.error) return { error: data.error.message };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!rawText) return { error: "No response from Gemini. Please use a clearer photo." };

    // Parse the JSON response from Gemini
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return {
        idType:      parsed.idType      || null,
        idNumber:    parsed.idNumber    || null,
        fullName:    parsed.fullName    || null,
        dateOfBirth: parsed.dateOfBirth || null,
        gender:      parsed.gender      || null,
        nationality: parsed.nationality || null,
        address:     parsed.address     || null,
        expiryDate:  parsed.expiryDate  || null,
        rawText,
      };
    } catch(parseErr) {
      // Gemini returned text but not valid JSON — fall back to regex parser
      const parsed = parseIdText(rawText);
      return { ...parsed, rawText };
    }

  } catch (err) {
    return { error: err.message || "Gemini API call failed" };
  }
}

// ── Smart ID text parser ──────────────────────────────────────────────────────
// Works on the raw OCR output from Google Vision
function parseIdText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const fullText = text.toUpperCase();

  let idType = null;
  let idNumber = null;
  let fullName = null;
  let dateOfBirth = null;
  let gender = null;
  let address = null;
  let expiryDate = null;
  let nationality = null;

  // ── Detect ID type ──────────────────────────────────────────────────────────
  if (fullText.includes("AADHAAR") || fullText.includes("UIDAI") || fullText.includes("आधार")) {
    idType = "Aadhaar";
  } else if (fullText.includes("INCOME TAX") || fullText.includes("PERMANENT ACCOUNT") || /[A-Z]{5}[0-9]{4}[A-Z]/.test(text)) {
    idType = "PAN";
  } else if (fullText.includes("PASSPORT") || fullText.includes("REPUBLIC OF INDIA") && fullText.includes("NATIONALITY")) {
    idType = "Passport";
  } else if (fullText.includes("DRIVING") || fullText.includes("LICENCE") || fullText.includes("LICENSE") || fullText.includes("DL-")) {
    idType = "Driving License";
  } else if (fullText.includes("ELECTION") || fullText.includes("VOTER") || fullText.includes("ELECTORAL")) {
    idType = "Voter ID";
  } else if (fullText.includes("EMIRATES") || fullText.includes("UNITED ARAB EMIRATES") || fullText.includes("الإمارات")) {
    idType = "Emirates ID";
  } else if (fullText.includes("KUWAIT") || fullText.includes("CIVIL ID") || fullText.includes("الكويت")) {
    idType = "Kuwait Civil ID";
  }

  // ── Extract ID number ───────────────────────────────────────────────────────
  if (idType === "Aadhaar") {
    // Aadhaar: 12 digits, often printed as XXXX XXXX XXXX
    const match = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
    if (match) idNumber = match[1].replace(/\s/g, " ");
  } else if (idType === "PAN") {
    const match = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (match) idNumber = match[1];
  } else if (idType === "Passport") {
    // Passport number: letter + 7 digits
    const match = text.match(/\b([A-Z][0-9]{7})\b/);
    if (match) idNumber = match[1];
  } else if (idType === "Driving License") {
    // DL format: DL-XXXXXXXXXXXXXXXXX or state code + number
    const match = text.match(/\b(DL-?[0-9A-Z\-]{8,20})\b/i) ||
                  text.match(/\b([A-Z]{2}[0-9]{2}\s?[0-9]{4}\s?[0-9]{7})\b/);
    if (match) idNumber = match[1];
  } else if (idType === "Emirates ID") {
    // Emirates ID: 784-YYYY-XXXXXXX-X
    const match = text.match(/\b(784-?\d{4}-?\d{7}-?\d)\b/);
    if (match) idNumber = match[1];
  } else if (idType === "Kuwait Civil ID") {
    // Kuwait Civil ID: 12 digits
    const match = text.match(/\b(\d{12})\b/);
    if (match) idNumber = match[1];
  } else if (idType === "Voter ID") {
    // Voter ID: 3 letters + 7 digits
    const match = text.match(/\b([A-Z]{3}[0-9]{7})\b/);
    if (match) idNumber = match[1];
  } else {
    // Generic: try any prominent number sequence
    const match = text.match(/\b(\d{8,16})\b/);
    if (match) idNumber = match[1];
  }

  // ── Extract name ────────────────────────────────────────────────────────────
  // Look for lines after "Name:" or similar labels
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(name|full name|customer name|holder|नाम)/i.test(line)) {
      // Name is usually on the next line or same line after the colon
      const colon = line.indexOf(":");
      if (colon !== -1 && line.slice(colon + 1).trim().length > 1) {
        fullName = line.slice(colon + 1).trim();
      } else if (lines[i + 1] && !/^\d/.test(lines[i + 1])) {
        fullName = lines[i + 1].trim();
      }
      break;
    }
  }
  // Fallback: for Aadhaar, name is usually on the first or second text line (all caps)
  if (!fullName && idType === "Aadhaar") {
    const nameLine = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l) || /^[A-Z ]{4,30}$/.test(l));
    if (nameLine) fullName = nameLine;
  }
  // For PAN, name is usually the last big text line before DOB
  if (!fullName && idType === "PAN") {
    const nameLine = lines.find(l => /^[A-Z ]{5,30}$/.test(l) && !l.includes("INDIA") && !l.includes("INCOME") && !l.includes("GOVT"));
    if (nameLine) fullName = nameLine;
  }

  // ── Extract date of birth ───────────────────────────────────────────────────
  // Formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY
  const dobPatterns = [
    /(?:DOB|D\.O\.B|Date of Birth|जन्म तिथि)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /(?:DOB|D\.O\.B|Date of Birth)[:\s]+(\d{2}\s+\w+\s+\d{4})/i,
    /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/,
  ];
  for (const pat of dobPatterns) {
    const match = text.match(pat);
    if (match) {
      const raw = match[1];
      // Convert to YYYY-MM-DD
      const parts = raw.split(/[\/\-\s]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY
          dateOfBirth = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
        } else if (parts[0].length === 4) {
          // YYYY-MM-DD
          dateOfBirth = raw;
        }
      }
      break;
    }
  }

  // ── Extract gender ──────────────────────────────────────────────────────────
  if (/\b(MALE|पुरुष)\b/i.test(text) && !/\bFEMALE\b/i.test(text)) gender = "Male";
  else if (/\b(FEMALE|महिला|स्त्री)\b/i.test(text)) gender = "Female";

  // ── Extract nationality ─────────────────────────────────────────────────────
  if (idType === "Passport") {
    const match = text.match(/Nationality[:\s]+([A-Z]+)/i);
    if (match) nationality = match[1];
    else if (fullText.includes("INDIAN")) nationality = "Indian";
  } else if (idType === "Emirates ID") {
    nationality = "UAE Resident";
    const match = text.match(/Nationality[:\s]+([A-Z]+)/i);
    if (match) nationality = match[1];
  } else if (idType === "Kuwait Civil ID") {
    nationality = "Kuwait Resident";
  } else {
    nationality = "Indian";
  }

  // ── Extract address (Aadhaar usually has it) ────────────────────────────────
  if (idType === "Aadhaar") {
    const addrStart = text.search(/(?:Address|पता)[:\s]/i);
    if (addrStart !== -1) {
      address = text.slice(addrStart).split("\n").slice(0, 3).join(", ").replace(/^Address[:\s]*/i, "").trim();
    }
  }

  // ── Extract expiry (Passport, DL, Emirates) ─────────────────────────────────
  const expMatch = text.match(/(?:Expiry|Expiration|Valid Until|Date of Expiry)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
  if (expMatch) {
    const parts = expMatch[1].split(/[\/\-]/);
    if (parts[2]?.length === 4) expiryDate = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }

  return {
    idType,
    idNumber,
    fullName,
    dateOfBirth,
    gender,
    address,
    expiryDate,
    nationality,
  };
}

// ── Upload ID image to Cloudinary (you already use Cloudinary!) ───────────────
async function uploadIdToCloudinary(imageBase64, mimeType, customerName) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return { error: "Cloudinary not configured" };

  try {
    const dataUri = `data:${mimeType};base64,${imageBase64}`;
    const formData = new FormData();
    formData.append("file", dataUri);
    formData.append("upload_preset", "ml_default"); // or your own unsigned preset
    formData.append("folder", "customer-ids");
    formData.append("public_id", `id_${Date.now()}_${(customerName || "customer").replace(/\s+/g, "_")}`);
    // Quality 70 keeps text readable while cutting file size by ~60%
    formData.append("quality", "70");
    formData.append("fetch_format", "auto");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (data.error) return { error: data.error.message };
    return { url: data.secure_url, publicId: data.public_id };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Upsert customer record from a booking ────────────────────────────────────
async function upsertCustomerFromBooking(booking) {
  if (!booking?.phone) return;
  try {
    const phone = String(booking.phone).trim();
    // Find all bookings for this phone to calculate stats
    const allBookings = await Booking.find({ phone }).lean();
    const totalBookings = allBookings.length;
    const totalSpent    = allBookings.reduce((s, b) => {
      if (!b.pricePerDay || !b.checkIn || !b.checkOut) return s + (b.receivedAmount || 0);
      const days = Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5));
      return s + (b.pricePerDay * days);
    }, 0);
    const sorted       = allBookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const firstBooking = sorted[0]?.checkIn || sorted[0]?.createdAt || null;
    const lastBooking  = sorted[sorted.length - 1]?.checkIn || null;
    const lastVehicle  = sorted[sorted.length - 1]?.vehicleName || null;

    // Build update — only overwrite KYC fields if they have a value
    const update = {
      name:         booking.customerName || undefined,
      phone,
      totalBookings,
      totalSpent,
      firstBooking,
      lastBooking,
      lastVehicle,
      updatedAt:    new Date(),
    };
    // KYC — only set if present in this booking
    const kyc = ["email","nationality","gender","dateOfBirth","idType","idNumber","idImageUrl","address"];
    for (const f of kyc) {
      if (booking[f]) update[f] = booking[f];
    }
    // source — set to walkin if any booking was walkin
    if (booking.source === "walkin") update.source = "walkin";

    await Customer.findOneAndUpdate(
      { phone },
      { $set: update, $setOnInsert: { createdAt: new Date(), source: booking.source || "online" } },
      { upsert: true, new: true }
    );
  } catch(e) {
    console.error("Customer upsert failed:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── POST /api/bookings?scan_id=true  — scan ID with Google Vision ──────────
  if (req.method === "POST" && req.query?.scan_id === "true") {
    const { imageBase64, mimeType, customerName, uploadImage } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    // 1. Scan with Google Vision
    const scanResult = await scanWithGoogleVision(imageBase64, mimeType || "image/jpeg");

    // 2. Optionally upload the image to Cloudinary (for record keeping)
    let imageUrl = null;
    if (uploadImage !== false) { // default: always upload
      const uploaded = await uploadIdToCloudinary(imageBase64, mimeType || "image/jpeg", customerName || "customer");
      if (uploaded.url) imageUrl = uploaded.url;
    }

    return res.json({ ...scanResult, imageUrl });
  }

  try {
    await connectDB();
    const id = req.query?.id || null;

    // ── Customer endpoints (?resource=customers) ──────────────────────────────
    if (req.query?.resource === "customers") {

      // GET ?resource=customers — list all customers, searchable
      if (req.method === "GET") {
        const q = req.query?.q || "";
        const filter = q ? {
          $or: [
            { name:    { $regex: q, $options: "i" } },
            { phone:   { $regex: q, $options: "i" } },
            { email:   { $regex: q, $options: "i" } },
            { idNumber:{ $regex: q, $options: "i" } },
          ]
        } : {};
        const customers = await Customer.find(filter).sort({ lastBooking: -1 });
        return res.json({ customers, total: customers.length });
      }

      // GET ?resource=customers&phone=xxx — single customer + their bookings
      if (req.method === "GET" && req.query?.phone) {
        const customer = await Customer.findOne({ phone: req.query.phone }).lean();
        if (!customer) return res.status(404).json({ error: "Customer not found" });
        const bookings = await Booking.find({ phone: req.query.phone }).sort({ createdAt: -1 }).lean();
        return res.json({ customer, bookings });
      }

      // PUT ?resource=customers&id=xxx — update customer manually
      if (req.method === "PUT" && req.query?.id) {
        const customer = await Customer.findByIdAndUpdate(req.query.id, { ...req.body, updatedAt: new Date() }, { new: true });
        if (!customer) return res.status(404).json({ error: "Not found" });
        return res.json(customer);
      }

      // DELETE ?resource=customers&id=xxx — delete customer record (not their bookings)
      if (req.method === "DELETE" && req.query?.id) {
        await Customer.findByIdAndDelete(req.query.id);
        return res.json({ success: true });
      }

      // POST ?resource=customers&sync=true — build customer DB from ALL bookings
      if (req.method === "POST" && req.query?.sync === "true") {
        const allBookings = await Booking.find({}).lean();
        // Group by phone
        const byPhone = {};
        for (const b of allBookings) {
          const phone = String(b.phone || "").trim();
          if (!phone) continue;
          if (!byPhone[phone]) byPhone[phone] = [];
          byPhone[phone].push(b);
        }
        let created = 0, updated = 0;
        for (const [phone, bookings] of Object.entries(byPhone)) {
          const sorted    = bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const latest    = sorted[sorted.length - 1];
          const totalSpent = bookings.reduce((s, b) => {
            if (!b.pricePerDay || !b.checkIn || !b.checkOut) return s + (b.receivedAmount || 0);
            const days = Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5));
            return s + (b.pricePerDay * days);
          }, 0);
          // Pick best KYC data across all bookings for this phone
          const kyc = {};
          const kycFields = ["email","nationality","gender","dateOfBirth","idType","idNumber","idImageUrl","address"];
          for (const b of bookings) {
            for (const f of kycFields) {
              if (b[f] && !kyc[f]) kyc[f] = b[f];
            }
          }
          const existing = await Customer.findOne({ phone });
          const data = {
            name:          latest.customerName,
            phone,
            totalBookings: bookings.length,
            totalSpent,
            firstBooking:  sorted[0]?.checkIn || sorted[0]?.createdAt,
            lastBooking:   latest?.checkIn || null,
            lastVehicle:   latest?.vehicleName || null,
            source:        bookings.some(b => b.source === "walkin") ? "walkin" : "online",
            updatedAt:     new Date(),
            ...kyc,
          };
          if (existing) {
            await Customer.findByIdAndUpdate(existing._id, { $set: data });
            updated++;
          } else {
            await Customer.create({ ...data, createdAt: new Date() });
            created++;
          }
        }
        return res.json({
          success: true,
          message: `Done. ${created} customers created, ${updated} updated.`,
          created, updated, total: created + updated,
        });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── Storage stats (?resource=stats) ──────────────────────────────────────
    if (req.query?.resource === "stats" && req.method === "GET") {
      const result = { mongodb: null, cloudinary: null };

      // ── MongoDB Atlas stats via Mongoose db.stats() ──
      try {
        const mongoose = require("mongoose");
        const adminDb  = mongoose.connection.db;
        const dbStats  = await adminDb.stats({ scale: 1024 }); // in KB
        // Per-collection counts + sizes
        const collections = await adminDb.listCollections().toArray();
        const collStats = [];
        for (const col of collections) {
          try {
            const cs = await adminDb.collection(col.name).stats({ scale: 1024 });
            collStats.push({
              name:    col.name,
              count:   cs.count   || 0,
              sizeMB:  Number(((cs.storageSize || cs.size || 0) / 1024).toFixed(3)),
            });
          } catch(e) { /* skip */ }
        }
        collStats.sort((a,b) => b.sizeMB - a.sizeMB);
        const totalMB  = Number(((dbStats.storageSize || dbStats.dataSize || 0) / 1024).toFixed(2));
        const limitMB  = 512; // MongoDB Atlas free tier
        result.mongodb = {
          usedMB:    totalMB,
          limitMB,
          usedPct:   Number(((totalMB / limitMB) * 100).toFixed(1)),
          collections: collStats,
        };
      } catch(e) {
        result.mongodb = { error: e.message };
      }

      // ── Cloudinary usage API ──
      try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey    = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (cloudName && apiKey && apiSecret) {
          const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
          const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          const usage = await resp.json();
          const usedBytes = usage.storage?.usage || 0;
          const limitBytes= usage.storage?.limit || (25 * 1024 * 1024 * 1024); // 25GB free
          const usedMB    = Number((usedBytes / (1024*1024)).toFixed(1));
          const limitMB   = Number((limitBytes / (1024*1024)).toFixed(0));
          const usedPct   = Number(((usedBytes / limitBytes) * 100).toFixed(1));
          result.cloudinary = {
            usedMB,
            limitMB,
            usedPct,
            resources: usage.resources?.usage || 0,
            transformations: usage.transformations?.usage || 0,
            bandwidth: Number(((usage.bandwidth?.usage||0)/(1024*1024)).toFixed(1)),
          };
        } else {
          result.cloudinary = { error: "Cloudinary env vars not set" };
        }
      } catch(e) {
        result.cloudinary = { error: e.message };
      }

      return res.json(result);
    }

    if (id) {
      if (req.method === "GET") {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Not found" });
        return res.json(booking);
      }
      if (req.method === "PUT") {
        const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
        if (!booking) return res.status(404).json({ error: "Not found" });
        upsertCustomerFromBooking(booking).catch(console.error);
        return res.json(booking);
      }
      if (req.method === "DELETE") {
        await Booking.findByIdAndDelete(id);
        try {
          const mongoose = require("mongoose");
          const AccSchema = new mongoose.Schema({}, { strict: false });
          const Acc = mongoose.models.Accounting || mongoose.model("Accounting", AccSchema);
          await Acc.deleteMany({ linkedBookingId: id });
        } catch(e) { console.error("Accounting cleanup error:", e.message); }
        return res.json({ success: true });
      }
    }

    if (req.method === "DELETE" && req.query.cleanup === "accounting") {
      try {
        const mongoose = require("mongoose");
        const AccSchema = new mongoose.Schema({}, { strict: false });
        const Acc = mongoose.models.Accounting || mongoose.model("Accounting", AccSchema);
        const allBookingIds = (await Booking.find({}, "_id").lean()).map(b => String(b._id));
        const allEntries = await Acc.find({ linkedBookingId: { $exists: true, $ne: null } }).lean();
        let deleted = 0;
        for (const entry of allEntries) {
          if (!allBookingIds.includes(String(entry.linkedBookingId))) {
            await Acc.findByIdAndDelete(entry._id);
            deleted++;
          }
        }
        return res.json({ success: true, deleted, message: deleted + " orphaned accounting entries removed" });
      } catch(e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── POST ?fix_sources=true — one-time migration: stamp source on all bookings ──
    if (req.method === "POST" && req.query?.fix_sources === "true") {
      const all = await Booking.find({}).lean();
      let fixed = 0, skipped = 0;
      for (const b of all) {
        // Already has a valid source — skip
        if (b.source === "walkin" || b.source === "online") { skipped++; continue; }

        // Detect walk-in by known patterns:
        // 1. phone is all zeros (placeholder used by walk-in form)
        // 2. customerName is literally "Walk-in Customer"
        // 3. notes contain "Register import" or "Walk-in" (legacy imports)
        // 4. status was set to "confirmed" at creation (walk-ins skip pending)
        //    AND no tokenAmount was requested (online bookings always set a token)
        const phone   = (b.phone || "").replace(/\D/g, "");
        const name    = (b.customerName || "").toLowerCase().trim();
        const notes   = (b.notes || "").toLowerCase();
        const isWalkin =
          phone === "0000000000" ||
          name  === "walk-in customer" ||
          notes.includes("register import") ||
          notes.includes("walk-in") ||
          (b.status === "confirmed" && !b.tokenAmount);

        await Booking.findByIdAndUpdate(b._id, {
          source: isWalkin ? "walkin" : "online",
        });
        fixed++;
      }
      return res.json({
        success: true,
        message: `Done. ${fixed} bookings updated, ${skipped} already had source set.`,
        fixed, skipped, total: all.length,
      });
    }

    // ── POST ?regen_accounting=true — create missing accounting entries for walk-ins ──
    if (req.method === "POST" && req.query?.regen_accounting === "true") {
      const { connectDB: _, Transaction } = require("./_db");

      // Get all walk-in bookings
      const walkins = await Booking.find({ source: "walkin" }).lean();

      // Get all existing accounting entries that are linked to a booking
      const existing = await Transaction.find({
        linkedBookingId: { $exists: true, $ne: "" }
      }, "linkedBookingId").lean();
      const existingIds = new Set(existing.map(e => String(e.linkedBookingId)));

      let created = 0, skipped = 0, noAmount = 0;

      for (const b of walkins) {
        const bid = String(b._id);

        // Skip if accounting entry already exists for this booking
        if (existingIds.has(bid)) { skipped++; continue; }

        // Calculate amount
        const ppd  = Number(b.pricePerDay) || 0;
        const days = (b.checkIn && b.checkOut)
          ? Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5))
          : 1;
        const amt  = ppd * days;

        // Skip if we have no price info at all
        if (amt <= 0) { noAmount++; continue; }

        await Transaction.create({
          type:            "income",
          category:        "vehicle_rental",
          amount:          amt,
          currency:        "INR",
          date:            b.createdAt || new Date(),
          description:     `Walk-in rental — ${b.vehicleName || "vehicle"} / ${b.customerName || "Walk-in Customer"}`,
          clientName:      b.customerName || "Walk-in Customer",
          linkedBookingId: bid,
          paymentStatus:   b.receivedAmount >= amt ? "paid" : b.receivedAmount > 0 ? "partial" : "pending",
          paymentMethod:   b.paymentMethod || "cash",
          notes:           `Auto-generated. Vehicle: ${b.vehicleName || "—"} | ₹${ppd}/day × ${days} day${days!==1?"s":""}`,
        });
        created++;
      }

      return res.json({
        success: true,
        message: `Done. ${created} entries created, ${skipped} already existed, ${noAmount} skipped (no price data).`,
        created, skipped, noAmount, total: walkins.length,
      });
    }

    if (req.method === "GET") {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    if (req.method === "POST") {
      const {
        customerName, phone, vehicleName, vehicleId,
        checkIn, checkOut, stayAddress, notes, pricePerDay,
        idType, idNumber, idImageUrl, email, nationality,
        dateOfBirth, gender, address, source,
      } = req.body;

      const days_ = (checkIn && checkOut)
        ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5))
        : 1;
      const totalAmt   = (pricePerDay || 0) * days_;
      const advanceAmt = totalAmt > 0 ? Math.ceil(totalAmt * 0.5) : 0;

      const booking = await Booking.create({
        customerName, phone, vehicleName,
        vehicleId: vehicleId || null,
        checkIn:  checkIn  ? new Date(checkIn)  : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        stayAddress, notes,
        status: source === "walkin" ? "confirmed" : "pending",
        pricePerDay: pricePerDay || 0,
        tokenAmount: advanceAmt,
        // ID fields
        idType:      idType      || null,
        idNumber:    idNumber    || null,
        idImageUrl:  idImageUrl  || null,   // Cloudinary URL of uploaded ID scan
        email:       email       || null,
        nationality: nationality || null,
        dateOfBirth: dateOfBirth || null,
        gender:      gender      || null,
        address:     address     || null,
        source:      source      || "online",
      });

      const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
      const days = days_;
      const msg = [
        `🛵 *New Booking Request!*`, ``,
        `*Vehicle:* ${vehicleName || "—"}`,
        `*Customer:* ${customerName}`,
        `*Phone:* ${phone}`,
        `*Check-in:* ${fmt(checkIn)}`,
        `*Check-out:* ${fmt(checkOut)}`,
        `*Duration:* ${days} day${days !== 1 ? "s" : ""}`,
        `*Stay Address:* ${stayAddress || "—"}`,
        source === "walkin" ? `*Source:* Walk-in (admin entry)` : null,
        idType ? `*ID:* ${idType} — ${idNumber || "—"}` : null,
        notes ? `*Notes:* ${notes}` : null,
        ``, `Booking ID: ${booking._id}`,
      ].filter(Boolean).join("\n");

      const whatsapp = (process.env.WHATSAPP_NUMBER || "919876543210").replace(/[^0-9]/g, "");
      const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

      let agency = null;
      try { agency = await Agency.findOne().lean(); } catch {}

      if (source !== "walkin") {
        sendBookingEmail({
          booking, days,
          agencyEmail: agency?.email || process.env.GMAIL_USER,
          agencyName:  agency?.name  || "Travel Engineers",
        }).catch(console.error);
      }

      // Auto-upsert customer record
      upsertCustomerFromBooking(booking).catch(console.error);

      return res.json({ success: true, booking, whatsappUrl });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Bookings error:", err);
    res.status(500).json({ error: err.message });
  }
};
