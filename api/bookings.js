const { connectDB, Booking, Agency, Customer, encryptObjectFields, decryptObjectFields, decryptObjectFieldsArray, decryptField, hashForSearch, hashPassword, verifyPassword, signCustomerToken, verifyCustomerToken } = require("./_db");

// Same rate-limit approach as auth.js / users.js — applied here to protect
// the customer login endpoint from brute-force password guessing.
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
function isRateLimited(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (now - record.firstAttempt > LOGIN_WINDOW_MS) { loginAttempts.delete(ip); return false; }
  return record.count >= LOGIN_MAX_ATTEMPTS;
}
function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) loginAttempts.set(ip, { count: 1, firstAttempt: now });
  else record.count++;
}
function clearAttempts(ip) { loginAttempts.delete(ip); }

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
    const prompt = `You are an ID document scanner. Extract all information from this ID document image. It may be an Indian document (Aadhaar, PAN, Driving Licence, Voter ID) or an international document (Passport, National ID, Driving Licence) from any country.
Return ONLY a valid JSON object with these exact fields (use null if not found):
{
  "idType": "Aadhaar|PAN|Passport|Driving License|Voter ID|National ID|Other",
  "idNumber": "the document number",
  "fullName": "full name on document",
  "dateOfBirth": "YYYY-MM-DD format or null",
  "gender": "Male|Female|Other or null",
  "nationality": "nationality or null",
  "address": "full address if present or null",
  "phone": "mobile/phone number printed on the document, if any, or null",
  "expiryDate": "YYYY-MM-DD format or null"
}
Return only the JSON, no explanation, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
          generationConfig: { temperature: 0, maxOutputTokens: 1024 }
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
        phone:       parsed.phone       || null,
        expiryDate:  parsed.expiryDate  || null,
        rawText,
      };
    } catch(parseErr) {
      // Gemini's response wasn't valid JSON (often a sign it was cut off
      // mid-response) — fall back to the regex parser on the raw text.
      const parsed = parseIdText(rawText);
      // If even the fallback found nothing usable, don't pretend this was a
      // clean success — surface it so the customer knows to fill in by hand
      // rather than silently submitting a booking with blank fields.
      if (!parsed.fullName && !parsed.idNumber) {
        return {
          ...parsed,
          rawText,
          warning: "Couldn't clearly read this document. Please check the photo is sharp and well-lit, or fill in the details manually below.",
        };
      }
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
  let phone = null;

  // ── Detect ID type ──────────────────────────────────────────────────────────
  // Detection patterns stay specific (different countries print very different
  // formats), but the labels shown to the user stay generic — "National ID"
  // covers any government ID card that isn't Aadhaar/PAN/Passport/DL/Voter ID.
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
  } else if (fullText.includes("NATIONAL ID") || fullText.includes("IDENTITY CARD") || /\b784-?\d{4}-?\d{7}-?\d\b/.test(text) || /\b\d{12}\b/.test(text)) {
    idType = "National ID";
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
  } else if (idType === "National ID") {
    // Covers various national ID card formats (e.g. 784-YYYY-XXXXXXX-X or a
    // plain 12-digit number) without singling out any one country.
    const match = text.match(/\b(784-?\d{4}-?\d{7}-?\d)\b/) || text.match(/\b(\d{12})\b/);
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

  // ── Extract phone number, if printed on the document ───────────────────────
  // Looks for a labelled phone/mobile field first, then falls back to any
  // standalone 10-15 digit sequence that looks like a phone number (with an
  // optional leading +countrycode) and isn't already captured as the ID number.
  const phoneLabelMatch = text.match(/(?:Phone|Mobile|Mob|Tel|Contact)[:\s]+(\+?[0-9][0-9\s\-]{7,16})/i);
  if (phoneLabelMatch) {
    phone = phoneLabelMatch[1].replace(/\s+/g, "").trim();
  } else {
    const looseMatch = text.match(/\+?\d{1,3}[\s\-]?\d{9,12}\b/);
    if (looseMatch && looseMatch[0].replace(/\D/g,"") !== (idNumber||"").replace(/\D/g,"")) {
      phone = looseMatch[0].replace(/\s+/g, "").trim();
    }
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
  } else if (idType === "National ID") {
    const match = text.match(/Nationality[:\s]+([A-Z]+)/i);
    if (match) nationality = match[1];
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

  // ── Extract expiry (Passport, Driving Licence, National ID) ────────────────
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
    phone,
    expiryDate,
    nationality,
  };
}

// ── Upload ID image to Cloudinary (signed upload — no preset required) ────────
// Previously used upload_preset "ml_default", which only works if that exact
// preset exists in the Cloudinary dashboard AND is set to "Unsigned". Most
// accounts don't have it, so uploads were failing silently — the booking still
// saved, the scan still showed extracted text, but idImageUrl was never set.
// A signed upload only needs the API key/secret we already require above, so
// it works regardless of any dashboard preset configuration.
async function uploadIdToCloudinary(imageBase64, mimeType, customerName) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return { error: "Cloudinary not configured" };

  try {
    const crypto = require("crypto");
    const dataUri = `data:${mimeType};base64,${imageBase64}`;
    const folder    = "customer-ids";
    const publicId  = `id_${Date.now()}_${(customerName || "customer").replace(/\s+/g, "_")}`;
    const timestamp = Math.round(Date.now() / 1000);

    // Cloudinary signed-upload rule: sign every param EXCEPT file/api_key/resource_type,
    // sorted alphabetically as key=value pairs joined with &, with the api secret appended.
    const paramsToSign = { folder, public_id: publicId, timestamp };
    const sortedParamString = Object.keys(paramsToSign)
      .sort()
      .map(k => `${k}=${paramsToSign[k]}`)
      .join("&");
    const signature = crypto
      .createHash("sha1")
      .update(sortedParamString + apiSecret)
      .digest("hex");

    const formData = new FormData();
    formData.append("file", dataUri);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("public_id", publicId);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (data.error) return { error: data.error.message };
    if (!data.secure_url) return { error: "Cloudinary upload returned no URL" };
    return { url: data.secure_url, publicId: data.public_id };
  } catch (err) {
    return { error: err.message };
  }
}


// ── Upsert customer record from a booking ────────────────────────────────────
async function upsertCustomerFromBooking(booking) {
  if (!booking?.phone) {
    console.error("[customer-sync] SKIPPED — no phone on booking", booking?._id);
    return;
  }
  try {
    const phone = String(booking.phone).trim();
    console.error(`[customer-sync] START phone=${phone} bookingId=${booking._id} idImageUrl=${booking.idImageUrl || "none"}`);
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
    // KYC — only set if present on THIS booking. This is intentional and must
    // stay this way: a booking with no idImageUrl (e.g. a phone-only repeat
    // booking) must NEVER overwrite an idImageUrl already saved on the customer
    // from an earlier booking. Each field only ever upgrades from empty -> value,
    // never downgrades from value -> empty/null.
    const kyc = ["email","nationality","gender","dateOfBirth","idType","idNumber","idNumberHash","idImageUrl","idImageUrlBack","address"];
    for (const f of kyc) {
      if (booking[f]) update[f] = booking[f];
    }
    // source — set to walkin if any booking was walkin
    if (booking.source === "walkin") update.source = "walkin";

    console.error("[customer-sync] WRITING update:", JSON.stringify(update));

    const result = await Customer.findOneAndUpdate(
      { phone },
      { $set: update, $setOnInsert: { createdAt: new Date(), source: booking.source || "online" } },
      { upsert: true, new: true }
    );

    console.error(`[customer-sync] SUCCESS phone=${phone} savedIdImageUrl=${result?.idImageUrl || "none"} customerId=${result?._id}`);
  } catch(e) {
    console.error("[customer-sync] FAILED phone=" + booking?.phone + " — " + e.message, e.stack);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,x-customer-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Same check as users.js — one shared convention across the whole API.
  // ADMIN_SECRET is the long-lived token issued at /api/users?action=admin-token
  // after a successful password login; it's never the raw password itself.
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "admin123";
  const isAdmin = (r) => (r.headers["x-admin-token"] || "") === ADMIN_SECRET;

  // Resolves the logged-in customer's id from x-customer-token, or null if
  // absent/invalid/expired. Unlike isAdmin (all-or-nothing), this scopes a
  // request to exactly one customer — every route using it must filter by
  // this id, never trust a customerId/phone passed in the request body.
  const getCustomerId = (r) => verifyCustomerToken(r.headers["x-customer-token"] || "");

  // ── Customer account endpoints (?resource=account) ─────────────────────────
  // Public-facing customer login/signup/profile — separate from the
  // admin-only ?resource=customers block below. None of these check
  // isAdmin; check-exists and login/set-password are intentionally public
  // (a customer isn't logged in yet when they call them), while "me" and
  // "update-profile" require a valid x-customer-token scoped to that one
  // customer only.
  if (req.query?.resource === "account") {

    // POST ?resource=account&action=check-exists — body: { identifier }
    // identifier is a phone or email. Returns only a boolean — never
    // confirms *which* field matched, never returns any customer data.
    if (req.method === "POST" && req.query?.action === "check-exists") {
      const identifier = String(req.body?.identifier || "").trim();
      if (!identifier) return res.status(400).json({ error: "identifier is required" });
      const customer = await Customer.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        hasAccount: true,
      }).select("_id").lean();
      return res.json({ exists: !!customer });
    }

    // POST ?resource=account&action=login — body: { identifier, password }
    if (req.method === "POST" && req.query?.action === "login") {
      const ip = getClientIp(req);
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
      }
      const identifier = String(req.body?.identifier || "").trim();
      const password   = String(req.body?.password   || "");
      if (!identifier || !password) return res.status(400).json({ error: "identifier and password are required" });

      const customer = await Customer.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        hasAccount: true,
      });
      if (!customer || !verifyPassword(password, customer.passwordSalt, customer.passwordHash)) {
        recordFailedAttempt(ip);
        return res.status(401).json({ error: "Incorrect phone/email or password" });
      }
      clearAttempts(ip);
      const token = signCustomerToken(String(customer._id));
      const profile = decryptObjectFields(customer.toObject());
      delete profile.passwordHash;
      delete profile.passwordSalt;
      return res.json({ success: true, token, customer: profile });
    }

    // NOTE: there is deliberately no standalone "set-password" endpoint here.
    // Account creation only happens inline during booking creation (see
    // accountPassword handling in the main POST /bookings handler below),
    // where the phone number is proven by the booking itself rather than
    // trusted blindly from a request body. A standalone endpoint taking a
    // raw customerId with no ownership proof was removed before shipping.

    // GET ?resource=account&action=me — requires x-customer-token
    // Returns the logged-in customer's own profile + all their bookings.
    if (req.method === "GET" && req.query?.action === "me") {
      const customerId = getCustomerId(req);
      if (!customerId) return res.status(401).json({ error: "Not logged in or session expired" });
      const customer = await Customer.findById(customerId).lean();
      if (!customer) return res.status(404).json({ error: "Account not found" });
      const bookings = await Booking.find({ phone: customer.phone }).sort({ createdAt: -1 }).lean();
      const profile = decryptObjectFields(customer);
      delete profile.passwordHash;
      delete profile.passwordSalt;
      return res.json({
        customer: profile,
        bookings: decryptObjectFieldsArray(bookings),
      });
    }

    // PUT ?resource=account&action=update-profile — requires x-customer-token
    // Customer editing their own saved details (address, email, etc.) —
    // password changes are NOT handled here, deliberately a separate flow.
    if (req.method === "PUT" && req.query?.action === "update-profile") {
      const customerId = getCustomerId(req);
      if (!customerId) return res.status(401).json({ error: "Not logged in or session expired" });
      // Never allow these to be changed through this route, regardless of
      // what's in the request body.
      const { password, passwordHash, passwordSalt, hasAccount, phone, _id, ...safeUpdates } = req.body || {};
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        encryptObjectFields({ ...safeUpdates, updatedAt: new Date() }),
        { new: true }
      );
      if (!customer) return res.status(404).json({ error: "Account not found" });
      const profile = decryptObjectFields(customer.toObject());
      delete profile.passwordHash;
      delete profile.passwordSalt;
      return res.json({ success: true, customer: profile });
    }

    // POST ?resource=account&action=change-password — requires x-customer-token
    if (req.method === "POST" && req.query?.action === "change-password") {
      const customerId = getCustomerId(req);
      if (!customerId) return res.status(401).json({ error: "Not logged in or session expired" });
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword are required" });
      if (String(newPassword).length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });
      const customer = await Customer.findById(customerId);
      if (!customer || !verifyPassword(currentPassword, customer.passwordSalt, customer.passwordHash)) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      const { salt, hash } = hashPassword(newPassword);
      customer.passwordSalt = salt;
      customer.passwordHash = hash;
      await customer.save();
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "Unknown account action" });
  }

  // ── POST /api/bookings?scan_id=true  — scan ID with Google Vision ──────────
  // Stays public: this runs DURING the public booking form, before any
  // booking (and therefore any login) exists.
  if (req.method === "POST" && req.query?.scan_id === "true") {
    const { imageBase64, mimeType, customerName, uploadImage } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    // 1. Scan with Google Vision
    const scanResult = await scanWithGoogleVision(imageBase64, mimeType || "image/jpeg");

    // 2. Optionally upload the image to Cloudinary (for record keeping)
    let imageUrl = null;
    let imageUploadError = null;
    if (uploadImage !== false) { // default: always upload
      const uploaded = await uploadIdToCloudinary(imageBase64, mimeType || "image/jpeg", customerName || "customer");
      if (uploaded.url) imageUrl = uploaded.url;
      else imageUploadError = uploaded.error || "Image upload failed for an unknown reason";
    }

    return res.json({ ...scanResult, imageUrl, imageUploadError });
  }

  try {
    await connectDB();
    const id = req.query?.id || null;

    // ── Customer endpoints (?resource=customers) ──────────────────────────────
    // Every branch in here touches customer PII (ID numbers, photos, address,
    // DOB) — gate the whole block, not branch by branch, so nothing new added
    // here later can accidentally slip through unauthenticated.
    if (req.query?.resource === "customers") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });

      // GET ?resource=customers&debug_sync_phone=xxx — manually trigger sync for
      // ONE phone number and return exactly what happened. Use this to debug
      // why a specific customer's idImageUrl isn't syncing, without digging
      // through Vercel logs.
      if (req.method === "GET" && req.query?.debug_sync_phone) {
        const phone = String(req.query.debug_sync_phone).trim();
        const bookings = await Booking.find({ phone }).sort({ createdAt: -1 }).lean();
        if (bookings.length === 0) {
          return res.json({ found: false, message: "No bookings found for this phone." });
        }
        const before = await Customer.findOne({ phone }).lean();
        // Also try a flexible match in case the stored phone has different
        // whitespace/type/format than the exact string we're querying with.
        const allCustomers = await Customer.find({}).lean();
        const flexMatch = allCustomers.filter(c => String(c.phone).trim() === phone);

        let upsertError = null;
        try {
          await upsertCustomerFromBooking(bookings[0]);
        } catch (e) {
          upsertError = e.message;
        }
        const after = await Customer.findOne({ phone }).lean();

        return res.json({
          found: true,
          queriedPhone: phone,
          queriedPhoneType: typeof phone,
          bookingUsed: { id: bookings[0]._id, idImageUrl: decryptField(bookings[0].idImageUrl), createdAt: bookings[0].createdAt, phoneOnBooking: bookings[0].phone, phoneTypeOnBooking: typeof bookings[0].phone },
          customerBefore: before ? { idImageUrl: decryptField(before.idImageUrl), updatedAt: before.updatedAt, phoneOnCustomer: before.phone, phoneTypeOnCustomer: typeof before.phone, exactMatchFound: true } : { exactMatchFound: false },
          flexMatchCount: flexMatch.length,
          flexMatches: flexMatch.map(c => ({ id: c._id, name: c.name, phone: c.phone, phoneType: typeof c.phone, idImageUrl: decryptField(c.idImageUrl) })),
          upsertError,
          customerAfter:  after ? { idImageUrl: decryptField(after.idImageUrl),  updatedAt: after.updatedAt } : { found: false },
        });
      }

      // GET ?resource=customers&phone=xxx — single customer + their bookings (MUST be before general GET)
      if (req.method === "GET" && req.query?.phone) {
        const customer = await Customer.findOne({ phone: req.query.phone }).lean();
        const bookings = await Booking.find({ phone: req.query.phone }).sort({ createdAt: -1 }).lean();
        const decryptedBookings = decryptObjectFieldsArray(bookings);
        if (!customer) return res.json({ customer: null, bookings: decryptedBookings });
        return res.json({ customer: decryptObjectFields(customer), bookings: decryptedBookings });
      }

      // GET ?resource=customers — list all customers, searchable, enriched with idImageUrl from bookings
      if (req.method === "GET") {
        // q can theoretically arrive as an array if the client ever sends the
        // same query param twice — coerce defensively so $regex always gets
        // a plain string, never an array (which Mongo would reject/ignore).
        let q = req.query?.q || "";
        if (Array.isArray(q)) q = q[0] || "";
        q = String(q).trim();

        // idNumber is encrypted, so it can't be substring-matched directly —
        // exact-match search works via idNumberHash instead (see _db.js).
        // We always include it in the $or; if q doesn't match any real ID
        // number it just won't contribute any results, same as any other
        // non-matching $or clause.
        const qHash = q ? hashForSearch(q) : null;
        const filter = q ? {
          $or: [
            { name:    { $regex: q, $options: "i" } },
            { phone:   { $regex: q, $options: "i" } },
            { email:   { $regex: q, $options: "i" } },
            ...(qHash ? [{ idNumberHash: qHash }] : []),
          ]
        } : {};

        // ?debug=true — surface exactly what's being queried and what the
        // raw (pre-enrichment) match looks like, to diagnose search issues
        // without needing direct DB access. Safe to leave in: admin-only
        // (this whole resource block is already gated by isAdmin above) and
        // returns no more PII than the normal response already would.
        if (req.query?.debug === "true") {
          const totalCustomers = await Customer.countDocuments({});
          const rawMatches = await Customer.find(filter).lean();
          const allNames = await Customer.find({}, "name phone").limit(20).lean();
          return res.json({
            receivedQuery: req.query?.q,
            normalizedQ: q,
            qType: typeof req.query?.q,
            filterUsed: filter,
            totalCustomersInDb: totalCustomers,
            matchCountForThisFilter: rawMatches.length,
            matchedNames: rawMatches.map(c => c.name),
            sampleOfAllNames: allNames.map(c => ({ name: c.name, phone: c.phone })),
          });
        }

        const customers = await Customer.find(filter).sort({ lastBooking: -1 }).lean();
        // Enrich each customer with idImageUrl from their most recent booking that has one
        const enriched = await Promise.all(customers.map(async (c) => {
          if (c.idImageUrl) return c;
          const b = await Booking.findOne({ phone: c.phone, idImageUrl: { $exists: true, $ne: "" } })
            .sort({ createdAt: -1 }).select("idImageUrl idType idNumber").lean();
          return {
            ...c,
            idImageUrl: b?.idImageUrl || "",
            idType:     c.idType   || b?.idType   || "",
            idNumber:   c.idNumber || b?.idNumber || "",
          };
        }));
        return res.json({ customers: decryptObjectFieldsArray(enriched), total: enriched.length });
      }

      // GET ?resource=customers&phone=xxx — REMOVED (handled above)

      // PUT ?resource=customers&id=xxx — update customer manually
      if (req.method === "PUT" && req.query?.id) {
        const customer = await Customer.findByIdAndUpdate(req.query.id, encryptObjectFields({ ...req.body, updatedAt: new Date() }), { new: true });
        if (!customer) return res.status(404).json({ error: "Not found" });
        return res.json(decryptObjectFields(customer.toObject()));
      }

      // DELETE ?resource=customers&id=xxx — delete customer record (not their bookings)
      if (req.method === "DELETE" && req.query?.id) {
        await Customer.findByIdAndDelete(req.query.id);
        return res.json({ success: true });
      }

      // POST ?resource=customers — manually create a new customer
      if (req.method === "POST" && !req.query?.sync && !req.query?.backfill_kyc) {
        const { name, phone, email, nationality, gender, dateOfBirth, idType, idNumber, address, source } = req.body;
        if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });
        const existing = await Customer.findOne({ phone: String(phone).trim() });
        if (existing) return res.status(409).json({ error: "A customer with this phone number already exists" });
        const customer = await Customer.create(encryptObjectFields({
          name, phone: String(phone).trim(),
          email: email || null,
          nationality: nationality || null,
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          idType: idType || null,
          idNumber: idNumber || null,
          address: address || null,
          source: source || "walkin",
          totalBookings: 0,
          totalSpent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        return res.json(decryptObjectFields(customer.toObject()));
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
          // NOTE: these fields are already ENCRYPTED ciphertext at this point
          // (read straight from Booking.find().lean()) — we copy them through
          // unchanged into Customer, we do NOT call encryptObjectFields here,
          // since that would encrypt already-encrypted ciphertext a second
          // time and make it permanently undecryptable.
          const kyc = {};
          const kycFields = ["email","nationality","gender","dateOfBirth","idType","idNumber","idNumberHash","idImageUrl","idImageUrlBack","address"];
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

      // POST ?resource=customers&backfill_kyc=true — additive-only KYC backfill
      // Unlike sync=true (which rebuilds name/totals/etc. for every customer),
      // this ONLY fills in missing KYC fields (idImageUrl, idType, idNumber, email,
      // nationality, gender, dateOfBirth, address) on existing customer docs by
      // scanning their bookings for the first non-empty value. It never overwrites
      // a field that's already set, and never touches non-KYC fields. Safe to
      // re-run any time, e.g. after older customers were created before the ID
      // scan feature existed, or before a booking's ID image finished uploading.
      if (req.method === "POST" && req.query?.backfill_kyc === "true") {
        // NOTE: ciphertext copy-through, same reasoning as sync=true above —
        // do not re-encrypt these values, they're already encrypted.
        const kycFields = ["email","nationality","gender","dateOfBirth","idType","idNumber","idNumberHash","idImageUrl","idImageUrlBack","address"];
        const customers = await Customer.find({}).lean();
        let updated = 0, skipped = 0, untouched = 0;

        for (const cust of customers) {
          // What's already missing on this customer?
          const missing = kycFields.filter(f => !cust[f]);
          if (missing.length === 0) { untouched++; continue; }

          const bookings = await Booking.find({ phone: cust.phone })
            .sort({ createdAt: 1 }) // oldest first, but we just need ANY non-empty value
            .lean();

          const fill = {};
          for (const f of missing) {
            const withValue = bookings.find(b => b[f]);
            if (withValue) fill[f] = withValue[f];
          }

          if (Object.keys(fill).length === 0) { skipped++; continue; }

          fill.updatedAt = new Date();
          await Customer.findByIdAndUpdate(cust._id, { $set: fill });
          updated++;
        }

        return res.json({
          success: true,
          message: `Done. ${updated} customers backfilled, ${skipped} had no KYC data in their bookings, ${untouched} already complete.`,
          updated, skipped, untouched, total: customers.length,
        });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── Storage stats (?resource=stats) ──────────────────────────────────────
    if (req.query?.resource === "stats" && req.method === "GET") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
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
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      if (req.method === "GET") {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Not found" });
        return res.json(decryptObjectFields(booking.toObject()));
      }
      if (req.method === "PUT") {
        const booking = await Booking.findByIdAndUpdate(id, encryptObjectFields(req.body), { new: true });
        if (!booking) return res.status(404).json({ error: "Not found" });
        // Must await: Vercel can terminate the function as soon as res.json()
        // is sent, so a fire-and-forget call here can get killed mid-write,
        // leaving the booking saved but the customer record never updated.
        try { await upsertCustomerFromBooking(booking); } catch (e) { console.error(e); }
        return res.json(decryptObjectFields(booking.toObject()));
      }
      if (req.method === "DELETE") {
        await Booking.findByIdAndDelete(id);
        try {
          // NOTE: accounting entries for bookings live in the Transaction
          // model (see _db.js), not a separate "Accounting" collection.
          const { Transaction } = require("./_db");
          await Transaction.deleteMany({ linkedBookingId: String(id) });
        } catch(e) { console.error("Accounting cleanup error:", e.message); }
        return res.json({ success: true });
      }
    }

    // ── Admin maintenance/cleanup tools below this line ────────────────────────
    // (accounting cleanup, bulk delete, source/date fixes, accounting regen)
    // All destructive or bulk-data operations — never safe to leave public.
    if (req.method === "DELETE" && req.query.cleanup === "accounting") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      try {
        const { Transaction } = require("./_db");
        const allBookingIds = (await Booking.find({}, "_id").lean()).map(b => String(b._id));
        const allEntries = await Transaction.find({ linkedBookingId: { $exists: true, $ne: "" } }).lean();
        let deleted = 0;
        for (const entry of allEntries) {
          if (!allBookingIds.includes(String(entry.linkedBookingId))) {
            await Transaction.findByIdAndDelete(entry._id);
            deleted++;
          }
        }
        return res.json({ success: true, deleted, message: deleted + " orphaned accounting entries removed" });
      } catch(e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── Verify admin password by calling the SAME /api/auth endpoint used
    // for the admin login screen, so this always matches whatever credential
    // source auth.js actually checks against (env var, DB, etc.) — no
    // duplicated / guessed logic here.
    async function verifyAdminPassword(req, password) {
      if (!password) return false;
      try {
        const proto = req.headers["x-forwarded-proto"] || "https";
        const host  = req.headers.host;
        const authRes = await fetch(`${proto}://${host}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await authRes.json();
        return !!data?.success;
      } catch (e) {
        console.error("Admin password verification failed:", e.message);
        return false;
      }
    }

    // ── DELETE ?ids=id1,id2,id3 — bulk delete SELECTED bookings ───────────────
    // Body: { password }. Requires the admin password and removes every
    // Transaction entry linked to any of the deleted bookings.
    if (req.method === "DELETE" && req.query?.ids) {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      const password = req.body?.password || "";
      const ok = await verifyAdminPassword(req, password);
      if (!ok) return res.status(401).json({ error: "Incorrect admin password" });

      const ids = String(req.query.ids).split(",").map(s => s.trim()).filter(Boolean);
      if (!ids.length) return res.status(400).json({ error: "No booking ids provided" });

      const { Transaction } = require("./_db");
      const delResult = await Booking.deleteMany({ _id: { $in: ids } });
      const txResult  = await Transaction.deleteMany({ linkedBookingId: { $in: ids.map(String) } });

      return res.json({
        success: true,
        message: `${delResult.deletedCount} booking(s) and ${txResult.deletedCount} linked accounting entr${txResult.deletedCount===1?"y":"ies"} deleted.`,
        deletedBookings: delResult.deletedCount,
        deletedTransactions: txResult.deletedCount,
      });
    }

    // ── DELETE ?deleteAll=true — delete ALL bookings ───────────────────────────
    // Body: { password }. Requires the admin password and removes every
    // Transaction entry linked to any booking (all booking-related accounting).
    if (req.method === "DELETE" && req.query?.deleteAll === "true") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      const password = req.body?.password || "";
      const ok = await verifyAdminPassword(req, password);
      if (!ok) return res.status(401).json({ error: "Incorrect admin password" });

      const { Transaction } = require("./_db");
      const delResult = await Booking.deleteMany({});
      const txResult  = await Transaction.deleteMany({ linkedBookingId: { $exists: true, $ne: "" } });

      return res.json({
        success: true,
        message: `All bookings deleted (${delResult.deletedCount}) along with ${txResult.deletedCount} linked accounting entr${txResult.deletedCount===1?"y":"ies"}.`,
        deletedBookings: delResult.deletedCount,
        deletedTransactions: txResult.deletedCount,
      });
    }

    // ── POST ?fix_sources=true — one-time migration: stamp source on all bookings ──
    if (req.method === "POST" && req.query?.fix_sources === "true") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
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

    // ── POST ?fix_dates=true — one-time migration: correct createdAt using checkIn ──
    // CSV-imported bookings were created via POST /bookings before that route
    // accepted a createdAt override, so Mongoose's schema default (Date.now)
    // stamped EVERY imported booking with the date it was imported, not the
    // date it actually happened. This collapses all historical bookings onto
    // a single wrong date in Accounting once regenerated.
    //
    // Fix: for any booking whose createdAt falls on or after the supplied
    // cutoff date (the day the bad import ran) AND has a checkIn date that's
    // clearly earlier, replace createdAt with checkIn. Bookings created
    // normally (no checkIn override needed, or checkIn is genuinely close to
    // createdAt) are left untouched.
    //
    // Usage: POST /api/bookings?fix_dates=true&cutoff=2026-06-08
    // (cutoff = the date your bad import/regenerate ran; defaults to today)
    if (req.method === "POST" && req.query?.fix_dates === "true") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      const cutoff = req.query.cutoff ? new Date(req.query.cutoff) : new Date();
      cutoff.setHours(0, 0, 0, 0);

      const all = await Booking.find({}).lean();
      let fixed = 0, skipped = 0, noCheckIn = 0;

      for (const b of all) {
        const created = b.createdAt ? new Date(b.createdAt) : null;
        const checkIn = b.checkIn ? new Date(b.checkIn) : null;

        // Only touch bookings whose createdAt is on/after the cutoff (i.e.
        // suspiciously matches the bad import date) — leave normally-created
        // bookings (today's real walk-ins/online bookings) untouched.
        if (!created || created < cutoff) { skipped++; continue; }
        if (!checkIn) { noCheckIn++; continue; }
        // If checkIn is already basically the same as createdAt, there's
        // nothing to fix (a booking genuinely made today, for today).
        if (Math.abs(created - checkIn) < 36e5) { skipped++; continue; } // <1hr apart

        await Booking.findByIdAndUpdate(b._id, { createdAt: checkIn });
        fixed++;
      }

      return res.json({
        success: true,
        message: `Done. ${fixed} bookings had createdAt corrected to their checkIn date. ${skipped} left untouched, ${noCheckIn} had no checkIn date to use.`,
        fixed, skipped, noCheckIn, total: all.length,
        cutoffUsed: cutoff.toISOString(),
      });
    }

    // ── POST ?regen_accounting=true — TRUE regenerate, ALL bookings ────────────
    // Deletes ALL accounting entries linked to any booking, then rebuilds an
    // entry for EVERY booking in the system — no filtering by source, no
    // skipping for missing price. Missing price just records as ₹0 so every
    // booking is represented and visible in accounting.
    if (req.method === "POST" && req.query?.regen_accounting === "true") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      const { connectDB: _, Transaction } = require("./_db");

      // Step 1 — delete ALL existing accounting entries linked to a booking
      // (they'll be rebuilt fresh from current booking data below)
      const deleteResult = await Transaction.deleteMany({
        linkedBookingId: { $exists: true, $ne: "" }
      });

      // Step 2 — rebuild an entry for every booking, regardless of source
      const allBookings = await Booking.find({}).lean();

      let created = 0, zeroAmount = 0;

      for (const b of allBookings) {
        const bid = String(b._id);

        // Calculate amount — priority order:
        //   1. pricePerDay × days  (set on booking — most accurate)
        //   2. receivedAmount      (what was actually collected — legacy imports)
        //   3. 0                   (no data at all — entry still created for visibility)
        //
        // NOTE: Notes field is intentionally NOT parsed. Legacy import notes like
        // "Register import. Vehicle: 9659. Payment: ₹3000" record a daily cash
        // batch total, NOT the individual booking amount — parsing them inflates totals.
        const ppd  = Number(b.pricePerDay) || 0;
        const days = (b.checkIn && b.checkOut)
          ? Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5))
          : 1;
        const ppdAmt      = ppd * days;
        const receivedAmt = Number(b.receivedAmount) || 0;

        let amt       = ppdAmt;
        let amtSource = `₹${ppd}/day × ${days} day${days!==1?"s":""}`;
        if (amt <= 0 && receivedAmt > 0) {
          amt       = receivedAmt;
          amtSource = `from receivedAmount (₹${receivedAmt})`;
        }

        if (amt <= 0) zeroAmount++;

        const isWalkin = b.source === "walkin";

        // Payment status
        let paymentStatus = "pending";
        if (amt > 0) {
          if (receivedAmt >= amt)   paymentStatus = "paid";
          else if (receivedAmt > 0) paymentStatus = "partial";
          // Legacy imports used receivedAmount as the full amount — mark as paid
          else if (ppdAmt <= 0 && amt === receivedAmt && receivedAmt > 0) paymentStatus = "paid";
        }
        // If amount came entirely from receivedAmount, it was already collected
        if (ppdAmt <= 0 && amt > 0 && amt === receivedAmt) paymentStatus = "paid";

        await Transaction.create({
          type:            "income",
          category:        "vehicle_rental",
          amount:          amt,
          currency:        "INR",
          // Prefer checkIn — it's the real historical booking date from CSV
          // imports. createdAt can't be trusted here: any booking imported
          // before the createdAt-override fix below was stamped with the
          // import date ("today"), not the booking's actual date.
          date:            b.checkIn || b.createdAt || new Date(),
          description:     `${isWalkin ? "Walk-in" : "Online"} rental — ${b.vehicleName || "vehicle"} / ${b.customerName || "Customer"}`,
          clientName:      b.customerName || "Customer",
          linkedBookingId: bid,
          paymentStatus,
          paymentMethod:   b.paymentMethod || "cash",
          notes:           `Auto-generated. Vehicle: ${b.vehicleName || "—"} | ${amtSource}${amt<=0?" (no price data on booking)":""}`,
        });
        created++;
      }

      return res.json({
        success: true,
        message: `Regenerated. ${deleteResult.deletedCount} old entries removed, ${created} entries created (${zeroAmount} with ₹0 — truly no price data found).`,
        deleted: deleteResult.deletedCount, created, zeroAmount, total: allBookings.length,
      });
    }

    if (req.method === "GET") {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(decryptObjectFieldsArray(bookings.map(b => b.toObject())));
    }

    // POST stays public — this is the public-facing booking form submitting
    // a new request. No login exists at this point in the flow.
    if (req.method === "POST") {
      const {
        customerName, phone, vehicleName, vehicleId, vehicleType,
        checkIn, checkOut, stayAddress, notes, pricePerDay,
        idType, idNumber, idImageUrl, idImageUrlBack, email, nationality,
        dateOfBirth, gender, address, source, createdAt,
        accountPassword, // optional — if set, creates a customer account alongside this booking
      } = req.body;

      const days_ = (checkIn && checkOut)
        ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5))
        : 1;
      const totalAmt   = (pricePerDay || 0) * days_;
      const advanceAmt = totalAmt > 0 ? Math.ceil(totalAmt * 0.5) : 0;

      // createdAt is normally left to the schema default (Date.now — the
      // actual moment the record is created). The ONLY legitimate reason to
      // override it is bulk/CSV import of historical bookings, where the
      // booking really happened on a past date and accounting/sorting needs
      // to reflect that real date instead of "today" (the import date).
      const createdAtOverride = createdAt ? new Date(createdAt) : undefined;
      const isValidOverride = createdAtOverride && !isNaN(createdAtOverride.getTime());

      const booking = await Booking.create(encryptObjectFields({
        customerName, phone, vehicleName,
        vehicleType: vehicleType || "",   // category requested (scooty/bike/car) when no specific unit was picked — admin allots one later
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
        idImageUrl:  idImageUrl  || null,       // front-of-ID Cloudinary URL
        idImageUrlBack: idImageUrlBack || null, // back-of-ID Cloudinary URL
        email:       email       || null,
        nationality: nationality || null,
        dateOfBirth: dateOfBirth || null,
        gender:      gender      || null,
        address:     address     || null,
        source:      source      || "online",
        ...(isValidOverride ? { createdAt: createdAtOverride } : {}),
      }));

      // booking.idNumber / idImageUrl / address / dateOfBirth are now
      // CIPHERTEXT (just encrypted on write above) — decrypt our own copy
      // before using these fields below for the WhatsApp message or
      // anything else that needs the real value in this same request.
      const bookingPlain = decryptObjectFields(booking.toObject());

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
          booking: bookingPlain, days,
          agencyEmail: agency?.email || process.env.GMAIL_USER,
          agencyName:  agency?.name  || "Travel Engineers",
        }).catch(console.error);
      }

      // Auto-upsert customer record
      // Must await: Vercel can terminate the function as soon as res.json()
      // is sent, so a fire-and-forget call here can get killed mid-write,
      // leaving the booking saved but the customer record never updated.
      // This was the cause of idImageUrl (and other KYC fields) showing up
      // on the booking but never syncing to the customer record.
      try { await upsertCustomerFromBooking(booking); } catch (e) { console.error(e); }

      // If the customer chose a password during checkout, create their
      // account now — the Customer record is guaranteed to exist at this
      // point because of the upsert just above. Only sets a password if
      // this phone doesn't already have an account (an existing customer
      // accidentally submitting a password here as a guest should not
      // silently overwrite their real password — they need to log in or
      // use the dedicated change-password flow for that).
      let accountToken = null;
      if (accountPassword && String(accountPassword).length >= 6) {
        try {
          const custForAccount = await Customer.findOne({ phone: String(phone).trim() });
          if (custForAccount && !custForAccount.hasAccount) {
            const { salt, hash } = hashPassword(String(accountPassword));
            custForAccount.passwordSalt = salt;
            custForAccount.passwordHash = hash;
            custForAccount.hasAccount = true;
            await custForAccount.save();
            accountToken = signCustomerToken(String(custForAccount._id));
          }
        } catch (e) {
          console.error("Account creation during booking failed:", e.message);
          // Non-fatal — the booking itself already succeeded above either way.
        }
      }

      return res.json({ success: true, booking: bookingPlain, whatsappUrl, accountToken });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Bookings error:", err);
    res.status(500).json({ error: err.message });
  }
};
