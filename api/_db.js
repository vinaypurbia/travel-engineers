const mongoose = require("mongoose");

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
  tag:       String,
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
  vehicleName:  { type: String, default: "" },
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
  tokenAmount: { type: Number, default: 0 }, // advance amount requested
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  connectDB,
  Agency:      mongoose.models.Agency      || mongoose.model("Agency",      agencySchema),
  Rental:      mongoose.models.Rental      || mongoose.model("Rental",      rentalSchema),
  Villa:       mongoose.models.Villa       || mongoose.model("Villa",       villaSchema),
  Testimonial: mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema),
  Inventory:   mongoose.models.Inventory   || mongoose.model("Inventory",   inventorySchema),
  Transaction: mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema),
  Booking:     mongoose.models.Booking     || mongoose.model("Booking",     bookingSchema),
};
