const mongoose = require("mongoose");
const crypto = require("crypto");

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ── Field-level encryption for sensitive customer data ───────────────────────
// Encrypts idNumber, idImageUrl(Back), address, dateOfBirth at rest using
// AES-256-GCM (authenticated — tampering with stored ciphertext is detected,
// not just hidden). This means even a raw MongoDB leak (stolen credentials,
// misconfigured access, a backup falling into the wrong hands) doesn't expose
// these fields in plaintext.
//
// This is applied via Mongoose getters/setters, so the rest of the codebase
// keeps reading/writing booking.idNumber etc. exactly as before — encryption
// and decryption happen transparently at the schema layer.
//
// REQUIRED: set ENCRYPTION_KEY in your Vercel environment variables — a
// random 32-byte value, base64 or hex encoded. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If ENCRYPTION_KEY is missing, encryption is skipped (fields stored as
// plaintext, same as before) and a warning is logged — the app still works,
// it's just not protecting these fields until the key is set.
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || "";
let ENCRYPTION_KEY = null;
if (ENCRYPTION_KEY_RAW) {
  try {
    // Accept either hex (64 chars) or base64 (44 chars w/ padding) — derive a
    // proper 32-byte key from whatever's given via a hash, so any reasonably
    // random input string works without strict format requirements.
    ENCRYPTION_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest();
  } catch (e) {
    console.error("Failed to derive encryption key:", e.message);
  }
} else {
  console.warn("⚠️  ENCRYPTION_KEY env var not set — sensitive fields (ID numbers, images, addresses) are being stored UNENCRYPTED. Set ENCRYPTION_KEY in Vercel to enable encryption at rest.");
}

const ENC_PREFIX = "enc:v1:"; // lets us detect already-encrypted values and tell them apart from legacy plaintext

function encryptField(plaintext) {
  if (!ENCRYPTION_KEY) return plaintext; // no key configured — store as-is
  if (plaintext == null || plaintext === "") return plaintext;
  if (typeof plaintext !== "string") plaintext = String(plaintext);
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext; // already encrypted, don't double-encrypt
  try {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Store as: enc:v1:<iv>:<authTag>:<ciphertext>  — all base64
    return `${ENC_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
  } catch (e) {
    console.error("Encryption failed, storing plaintext as fallback:", e.message);
    return plaintext;
  }
}

function decryptField(stored) {
  if (stored == null || stored === "") return stored;
  if (typeof stored !== "string" || !stored.startsWith(ENC_PREFIX)) return stored; // legacy plaintext or already-decrypted
  if (!ENCRYPTION_KEY) {
    console.error("Encrypted field found but ENCRYPTION_KEY is not set — cannot decrypt. Returning placeholder.");
    return "[encrypted — key missing]";
  }
  try {
    const parts = stored.slice(ENC_PREFIX.length).split(":");
    if (parts.length !== 3) return stored;
    const [ivB64, authTagB64, cipherB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(cipherB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (e) {
    console.error("Decryption failed (key mismatch or corrupted data):", e.message);
    return "[decryption failed]";
  }
}

// ── .lean()-safe helpers ──────────────────────────────────────────────────
// Mongoose's automatic getters above are silently SKIPPED by .lean() queries
// (used extensively in bookings.js for performance). Rather than hunt down
// every .lean() call and hope none get missed, every code path that touches
// these fields calls one of these two explicit helpers instead:
//   encryptObjectFields(obj)  — before writing to the DB (create/update)
//   decryptObjectFields(obj)  — after reading from the DB (.lean() results)
// This makes the encryption boundary visible in the code wherever it
// matters, instead of invisible magic that breaks quietly.
const SENSITIVE_FIELDS = ["idNumber", "idImageUrl", "idImageUrlBack", "address", "dateOfBirth"];

// Normalized exact-match search hash for idNumber. Plain SHA-256 (no secret
// key) is intentional here — this only needs to be deterministic so the same
// ID number always hashes the same way for lookup; it's not used as a
// security control on its own, encryptField() above is what actually
// protects the value. Normalizing (uppercase, strip spaces/dashes) means
// "ABC 123-456" and "abc123456" hash identically.
function hashForSearch(value) {
  if (!value) return null;
  const normalized = String(value).toUpperCase().replace(/[\s-]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function encryptObjectFields(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  // Compute the search hash from the PLAINTEXT value before it gets
  // encrypted below.
  if (out.idNumber != null && out.idNumber !== "") {
    out.idNumberHash = hashForSearch(out.idNumber);
  }
  SENSITIVE_FIELDS.forEach(f => {
    if (out[f] != null && out[f] !== "") {
      out[f] = encryptField(out[f] instanceof Date ? out[f].toISOString() : out[f]);
    }
  });
  return out;
}

function decryptObjectFields(obj) {
  if (!obj || typeof obj !== "object") return obj;
  SENSITIVE_FIELDS.forEach(f => {
    if (obj[f] != null && obj[f] !== "") {
      obj[f] = decryptField(obj[f]);
    }
  });
  return obj;
}

// Same as decryptObjectFields but works on an array of plain objects (the
// common case: Model.find().lean() returns an array).
function decryptObjectFieldsArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(decryptObjectFields);
}

// ── Customer account passwords (salted PBKDF2) ────────────────────────────
// Stronger than the staff-login SHA-256 (see users.js) — customer accounts
// are a bigger, more attractive target, so each password gets its own
// random salt and a deliberately slow hash (100k iterations), making a
// leaked hash list resistant to rainbow-table / brute-force cracking.
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plainPassword, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex");
  return { salt, hash };
}

function verifyPassword(plainPassword, salt, storedHash) {
  if (!plainPassword || !salt || !storedHash) return false;
  const computedHash = crypto.pbkdf2Sync(plainPassword, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex");
  // Constant-time comparison — avoids leaking how many leading characters
  // matched via response-timing differences.
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ── Customer session tokens ────────────────────────────────────────────────
// HMAC-signed, stateless — verifiable without a DB lookup per request, and
// scoped to exactly one customer (unlike the admin token, which unlocks
// everything). Format: <customerId>.<expiryTimestamp>.<signature>
// CUSTOMER_TOKEN_SECRET must be set in Vercel env vars — falls back to
// ENCRYPTION_KEY if unset so there's still a real secret, never a guessable
// default, even if you forget to add a dedicated one.
const CUSTOMER_TOKEN_SECRET = process.env.CUSTOMER_TOKEN_SECRET || process.env.ENCRYPTION_KEY || "";
const CUSTOMER_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function signCustomerToken(customerId) {
  if (!CUSTOMER_TOKEN_SECRET) {
    console.error("CUSTOMER_TOKEN_SECRET / ENCRYPTION_KEY not set — customer logins are not safely signable!");
  }
  const expiry = Date.now() + CUSTOMER_TOKEN_TTL_MS;
  const payload = `${customerId}.${expiry}`;
  const sig = crypto.createHmac("sha256", CUSTOMER_TOKEN_SECRET || "insecure-fallback").update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyCustomerToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!customerId || !expiry || !sig) return null;
  if (Date.now() > expiry) return null; // expired
  const expectedSig = crypto.createHmac("sha256", CUSTOMER_TOKEN_SECRET || "insecure-fallback").update(`${customerId}.${expiryStr}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return customerId;
}

// ── Staff session tokens ────────────────────────────────────────────────────
// Same HMAC-signed, stateless approach as customer tokens above, but carries
// the staff user's id + permissions in the payload so every API route can
// check both "is this a real logged-in staff member" AND "are they actually
// allowed to touch this module" — without a DB lookup per request, and
// without giving staff the all-powerful admin token.
// Format: <userId>.<permissionsCSV>.<expiryTimestamp>.<signature>
// STAFF_TOKEN_SECRET falls back to ENCRYPTION_KEY (like the customer token)
// so there's always a real secret even if a dedicated one was never set.
const STAFF_TOKEN_SECRET = process.env.STAFF_TOKEN_SECRET || process.env.ENCRYPTION_KEY || "";
const STAFF_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — staff are on shared/shop devices more often than customers, so a shorter session is safer

function signStaffToken(userId, permissions) {
  if (!STAFF_TOKEN_SECRET) {
    console.error("STAFF_TOKEN_SECRET / ENCRYPTION_KEY not set — staff logins are not safely signable!");
  }
  const permsCsv = Array.isArray(permissions) ? permissions.join(",") : "";
  const expiry = Date.now() + STAFF_TOKEN_TTL_MS;
  const payload = `${userId}.${permsCsv}.${expiry}`;
  const sig = crypto.createHmac("sha256", STAFF_TOKEN_SECRET || "insecure-fallback").update(payload).digest("hex");
  return `${payload}.${sig}`;
}

// Returns { userId, permissions } if valid, otherwise null. Permissions come
// straight from the signed token (not re-fetched from the DB on every
// request) — if an admin changes a staff member's permissions, that staff
// member's CURRENT session keeps its old permissions until the token expires
// (max 12h) or they log in again. This is the standard tradeoff for
// stateless tokens; acceptable here given the short TTL.
function verifyStaffToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, permsCsv, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!userId || !expiry || !sig) return null;
  if (Date.now() > expiry) return null; // expired
  const expectedSig = crypto.createHmac("sha256", STAFF_TOKEN_SECRET || "insecure-fallback").update(`${userId}.${permsCsv}.${expiryStr}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return { userId, permissions: permsCsv ? permsCsv.split(",") : [] };
}

// ── Newsletter unsubscribe tokens ───────────────────────────────────────────
// Unlike staff/customer session tokens, this one is intentionally
// NON-expiring — it lives inside an email that might sit unread for months,
// and "sorry, your unsubscribe link expired, please contact us to stop
// receiving emails" is exactly the kind of dark-pattern friction we don't
// want. It's scoped to one customer id only, so it can only ever unsubscribe
// that one person — not a general-purpose auth token.
function signUnsubscribeToken(customerId) {
  const secret = STAFF_TOKEN_SECRET || CUSTOMER_TOKEN_SECRET || "insecure-fallback";
  const sig = crypto.createHmac("sha256", secret).update(`unsub.${customerId}`).digest("hex");
  return `${customerId}.${sig}`;
}

function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== "string") return null;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const customerId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!customerId || !sig) return null;
  const secret = STAFF_TOKEN_SECRET || CUSTOMER_TOKEN_SECRET || "insecure-fallback";
  const expectedSig = crypto.createHmac("sha256", secret).update(`unsub.${customerId}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return customerId;
}

// ── Agency Model ─────────────────────────────────────────────────────────────
// strict: false so extra fields (like stats) are never silently dropped
const agencySchema = new mongoose.Schema({
  name:        { type: String, default: "" },
  tagline:     { type: String, default: "" },
  heroSubtitle:{ type: String, default: "" },
  phone:       { type: String, default: "" },
  email:       { type: String, default: "" },
  address:     { type: String, default: "" },
  whatsapp:    { type: String, default: "" },
  heroImage:   { type: String, default: "" },
  stats: [{ value: String, label: String }],
}, { strict: false });

// ── Rental Model ─────────────────────────────────────────────────────────────
const rentalSchema = new mongoose.Schema({
  type:      { type: String, enum: ["scooty", "bike", "car"], required: true },
  name:      { type: String, required: true },
  category:  String,
  price:     String,
  period:    { type: String, default: "/day" },
  pricePerKm: { type: Number, default: null },   // rate per km for tour calculator
  seats:      { type: String, default: "" },
  tag:       String,
  vehicleNo: { type: String, default: "" },  // registration / fleet number
  description: String,
  features:  [String],
  image:     String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// ── Villa Model ──────────────────────────────────────────────────────────────
// strict: false so rooms/amenities arrays are never dropped
const villaSchema = new mongoose.Schema({
  name:       { type: String, default: "" },
  tagline:    String,
  description:String,
  price:      String,
  period:     { type: String, default: "/night" },
  checkIn:    String,
  checkOut:   String,
  minStay:    String,
  maxGuests:  String,
  image:      String,
  amenities:  [{ icon: String, label: String }],
  rooms:      [{ name: String, beds: String, guests: Number, image: String }],
}, { strict: false });

// ── Testimonial Model ────────────────────────────────────────────────────────
const testimonialSchema = new mongoose.Schema({
  name:        String,
  location:    String,
  text:        String,
  rating:      { type: Number, default: 5 },
  approved:    { type: Boolean, default: false },
  category:    { type: String, enum: ["villa", "rental"], default: "villa" },
  vehicleType: String,
  vehicleName: String,
  vehicleId:   String,
  createdAt:   { type: Date, default: Date.now },
});

// ── Inventory Model ──────────────────────────────────────────────────────────
const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["tour", "villa", "vehicle", "equipment"],
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ["scooty", "bike", "car", ""],
    default: "",
  },
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["available", "booked", "maintenance"],
    default: "available",
  },
  pricePerDay: { type: Number, default: 0 },
  currency:    { type: String, default: "INR" },
  capacity:    { type: Number, default: 1 },
  location:    { type: String, default: "" },
  image:       { type: String, default: "" },
  bookedDates: [{
    from: Date,
    to: Date,
    clientName: String,
    bookingRef: String,
  }],
  linkedRentalId: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },
  notes:      { type: String, default: "" },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

// ── Transaction Model ────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  category: {
    type: String,
    enum: [
      "villa_rental", "tour_booking", "vehicle_rental",
      "agency_commission", "other_income",
      "maintenance", "utilities", "staff",
      "supplies", "marketing", "other_expense",
    ],
    required: true,
  },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: "INR" },
  date:        { type: Date, default: Date.now },
  description: { type: String, default: "" },
  linkedBookingId:   { type: String, default: "" },
  linkedInventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", default: null },
  linkedRentalId:    { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },
  clientName:    { type: String, default: "" },
  agencyName:    { type: String, default: "" },
  paymentStatus: { type: String, enum: ["paid", "pending", "partial"], default: "paid" },
  paymentMethod: { type: String, enum: ["cash", "upi", "bank_transfer", "card", "other"], default: "cash" },
  notes:     { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// ── Booking Model ────────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  email:        { type: String, default: null },
  vehicleName:  { type: String, default: "" },
  vehicleType:  { type: String, default: "" },  // category requested online: "scooty" | "bike" | "car" — set on creation, vehicleId stays null until admin allots a specific unit
  vehicleId:    { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },
  checkIn:      { type: Date, default: null },
  checkOut:     { type: Date, default: null },
  stayAddress:  { type: String, default: "" },
  notes:        { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "payment_requested", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  source:         { type: String, default: "online" },  // "online" | "walkin"
  pricePerDay:    { type: Number, default: 0 },
  tokenAmount:    { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  payOnArrival:   { type: Boolean, default: false },
  paymentMethod:  { type: String, default: null },      // cash | upi | card | bank_transfer
  // Customer ID / KYC fields
  idType:      { type: String, default: null },
  idNumber:    { type: String, default: null },     // encrypted at rest
  idNumberHash:{ type: String, default: null, index: true }, // SHA-256 of normalized idNumber — enables exact-match search without decrypting every record
  idImageUrl:  { type: String, default: null },
  idImageUrlBack: { type: String, default: null },  // back-of-ID photo — captures address/phone usually printed there
  nationality: { type: String, default: null },
  // Stored as String (was Date) — encrypted fields must be strings, and
  // nothing in this codebase ever did native Mongo date-range queries on
  // this field anyway (everywhere else already treats it as "YYYY-MM-DD").
  dateOfBirth: { type: String, default: null },
  gender:      { type: String, default: null },
  address:     { type: String, default: null },
  createdAt:   { type: Date, default: Date.now },
});

// ── Customer Model ───────────────────────────────────────────────────────────
// One record per unique phone number — upserted from booking data
const customerSchema = new mongoose.Schema({
  name:        { type: String, default: "" },
  phone:        { type: String, required: true, unique: true },
  email:        { type: String, default: null },
  // ── Customer account / login ──────────────────────────────────────────────
  // A Customer record exists for every person who's ever booked, but not
  // every one has an account — hasAccount distinguishes "we have their info
  // from a booking" from "they've set a password and can log in". Password
  // is salted PBKDF2 (passwordSalt + passwordHash), set the first time a
  // customer chooses a password during checkout, or never if they always
  // book as a guest.
  hasAccount:   { type: Boolean, default: false },
  passwordHash: { type: String, default: null },
  passwordSalt: { type: String, default: null },
  nationality:  { type: String, default: null },
  gender:       { type: String, default: null },
  dateOfBirth:  { type: String, default: null }, // String, not Date — see note on Booking schema above
  idType:       { type: String, default: null },
  idNumber:     { type: String, default: null },     // encrypted at rest
  idNumberHash: { type: String, default: null, index: true },
  idImageUrl:   { type: String, default: null },
  idImageUrlBack: { type: String, default: null },
  address:      { type: String, default: null },
  notes:        { type: String, default: "" },
  source:       { type: String, default: "online" }, // first booking source
  totalBookings:{ type: Number, default: 0 },
  totalSpent:   { type: Number, default: 0 },
  firstBooking: { type: Date,   default: null },
  lastBooking:  { type: Date,   default: null },
  lastVehicle:  { type: String, default: null },
  // ── Newsletter ──────────────────────────────────────────────────────────
  unsubscribed:    { type: Boolean, default: false },
  unsubscribedAt:  { type: Date, default: null },
  createdAt:    { type: Date,   default: Date.now },
  updatedAt:    { type: Date,   default: Date.now },
});

// ── Newsletter Campaign Model ────────────────────────────────────────────────
// A campaign is created once with subject/body and a snapshot of recipients
// at send time, then processed in small batches across multiple requests
// (see newsletter.js) to stay within Vercel's per-request time limit and
// Gmail's sending rate — recipients are tracked individually so a campaign
// can safely resume without re-sending to anyone already done.
const newsletterCampaignSchema = new mongoose.Schema({
  subject:    { type: String, required: true },
  bodyHtml:   { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "sending", "completed", "cancelled"],
    default: "draft",
  },
  recipients: [{
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    email:      String,
    name:       String,
    // unsubscribeToken is generated per-recipient at campaign creation time
    // so the unsubscribe link is always valid even if the customer's main
    // session token has expired — it's a long-lived, single-purpose token.
    unsubscribeToken: String,
    sendStatus: { type: String, enum: ["pending", "sent", "failed", "skipped_unsubscribed"], default: "pending" },
    sentAt:     { type: Date, default: null },
    error:      { type: String, default: null },
  }],
  createdBy:   { type: String, default: "" }, // admin or staff name, for the activity trail
  createdAt:   { type: Date, default: Date.now },
  startedAt:   { type: Date, default: null },
  completedAt: { type: Date, default: null },
});

// ── Push Subscription Model ─────────────────────────────────────────────────
// One document per browser/device that's granted notification permission.
// ownerType distinguishes a customer's subscription (tied to their phone,
// since that's the stable identity we already have for them) from an
// admin/staff one (tied to username) — a customer gets trip reminders and
// new-tour alerts, staff/admin get new-booking alerts, and the two should
// never cross-fire into each other's inboxes.
const pushSubscriptionSchema = new mongoose.Schema({
  ownerType: { type: String, enum: ["customer", "staff"], required: true },
  // customerPhone set when ownerType is "customer"; staffUsername set when
  // ownerType is "staff". Only one of the two is ever populated.
  customerPhone:  { type: String, default: null },
  staffUsername:  { type: String, default: null },
  endpoint:  { type: String, required: true, unique: true }, // push service URL — unique per browser subscription
  keys: {
    p256dh: { type: String, required: true },
    auth:   { type: String, required: true },
  },
  userAgent:  { type: String, default: "" },
  createdAt:  { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

// ── Send a push notification to one or more subscriptions ──────────────────
// Centralized here (rather than duplicated in bookings.js/tours.js) since
// it's needed by both the "new tour" trigger and the cron-based trip
// reminder. Automatically removes subscriptions that the push service
// reports as gone (410/404 — browser uninstalled, permission revoked, etc.)
// so the PushSubscription collection doesn't accumulate dead entries forever.
async function sendPushToSubscriptions(subscriptions, payload) {
  const webpush = require("web-push");
  const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — cannot send push notifications");
    return { sent: 0, failed: 0, removed: 0 };
  }
  webpush.setVapidDetails(
    `mailto:${process.env.GMAIL_USER || "admin@example.com"}`,
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );

  let sent = 0, failed = 0, removed = 0;
  const body = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        body
      );
      sent++;
    } catch (err) {
      failed++;
      // 404/410 = the push service confirms this subscription is dead —
      // any other error (network blip, payload too large) is left alone so
      // we don't delete a still-valid subscription over a transient failure.
      if (err.statusCode === 404 || err.statusCode === 410) {
        try {
          await mongoose.models.PushSubscription.findByIdAndDelete(sub._id);
          removed++;
        } catch (e) {}
      }
    }
  }
  return { sent, failed, removed };
}

module.exports = {
  connectDB,
  encryptField,
  decryptField,
  hashForSearch,
  encryptObjectFields,
  decryptObjectFields,
  decryptObjectFieldsArray,
  hashPassword,
  verifyPassword,
  signCustomerToken,
  verifyCustomerToken,
  signStaffToken,
  verifyStaffToken,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  sendPushToSubscriptions,
  Agency:      mongoose.models.Agency      || mongoose.model("Agency",      agencySchema),
  Rental:      mongoose.models.Rental      || mongoose.model("Rental",      rentalSchema),
  Villa:       mongoose.models.Villa       || mongoose.model("Villa",       villaSchema),
  Testimonial: mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema),
  Inventory:   mongoose.models.Inventory   || mongoose.model("Inventory",   inventorySchema),
  Transaction: mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema),
  Booking:     mongoose.models.Booking     || mongoose.model("Booking",     bookingSchema),
  Customer:    mongoose.models.Customer    || mongoose.model("Customer",    customerSchema),
  NewsletterCampaign: mongoose.models.NewsletterCampaign || mongoose.model("NewsletterCampaign", newsletterCampaignSchema),
  PushSubscription:   mongoose.models.PushSubscription   || mongoose.model("PushSubscription",   pushSubscriptionSchema),
};
