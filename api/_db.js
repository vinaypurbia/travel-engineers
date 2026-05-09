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

// ── Existing Models ──────────────────────────────────────────────────────────
const agencySchema = new mongoose.Schema({
  name: { type: String, default: "IslandDrift" },
  tagline: { type: String, default: "Ride Free. Stay Wild. Explore More." },
  heroSubtitle: { type: String, default: "Scooters · Cars · Bikes · Villa" },
  phone: { type: String, default: "+91 98765 43210" },
  email: { type: String, default: "hello@islanddrift.com" },
  address: { type: String, default: "Beach Road, Goa" },
  whatsapp: { type: String, default: "919876543210" },
  heroImage: { type: String, default: "" },
});

const rentalSchema = new mongoose.Schema({
  type: { type: String, enum: ["scooty", "bike", "car"], required: true },
  name: { type: String, required: true },
  category: String,
  price: String,
  period: { type: String, default: "/day" },
  tag: String,
  description: String,
  features: [String],
  image: String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const villaSchema = new mongoose.Schema({
  name: { type: String, default: "IslandDrift Villa" },
  tagline: String,
  description: String,
  price: String,
  period: { type: String, default: "/night" },
  checkIn: String,
  checkOut: String,
  minStay: String,
  maxGuests: String,
  image: String,
  amenities: [{ icon: String, label: String }],
  rooms: [{ name: String, beds: String, guests: Number, image: String }],
});

const testimonialSchema = new mongoose.Schema({
  name: String,
  location: String,
  text: String,
  rating: { type: Number, default: 5 },
  approved: { type: Boolean, default: false },
  category: { type: String, enum: ["villa", "rental"], default: "villa" },
  vehicleType: String,
  vehicleName: String,
  vehicleId: String,
  createdAt: { type: Date, default: Date.now },
});

// ── NEW: Inventory Model ─────────────────────────────────────────────────────
// Tracks all bookable/ownable assets: tours, villas, vehicles, equipment
const inventorySchema = new mongoose.Schema({
  // What kind of asset
  type: {
    type: String,
    enum: ["tour", "villa", "vehicle", "equipment"],
    required: true,
  },
  // Vehicle sub-type (only used when type === "vehicle")
  vehicleType: {
    type: String,
    enum: ["scooty", "bike", "car", ""],
    default: "",
  },
  name: { type: String, required: true },
  description: { type: String, default: "" },

  // Availability
  status: {
    type: String,
    enum: ["available", "booked", "maintenance"],
    default: "available",
  },

  // Pricing
  pricePerDay: { type: Number, default: 0 },   // numeric, in INR
  currency: { type: String, default: "INR" },

  // Capacity / meta
  capacity: { type: Number, default: 1 },       // guests / seats / units
  location: { type: String, default: "" },
  image: { type: String, default: "" },

  // Booking windows
  bookedDates: [
    {
      from: Date,
      to: Date,
      clientName: String,
      bookingRef: String,
    },
  ],

  // Link back to an existing Rental doc (for vehicles already in rentals collection)
  linkedRentalId: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },

  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── NEW: Transaction Model ───────────────────────────────────────────────────
// Records every income or expense entry for the accounting ledger
const transactionSchema = new mongoose.Schema({
  // Income or expense
  type: { type: String, enum: ["income", "expense"], required: true },

  // Category tells us the revenue/cost stream
  category: {
    type: String,
    enum: [
      "villa_rental",       // income: villa booking revenue
      "tour_booking",       // income: tour package revenue
      "vehicle_rental",     // income: scooty/bike/car rental revenue
      "agency_commission",  // income: commission earned from agency referrals
      "other_income",       // income: anything else
      "maintenance",        // expense: vehicle/property maintenance
      "utilities",          // expense: electricity, water, etc.
      "staff",              // expense: salaries, wages
      "supplies",           // expense: consumables, equipment purchases
      "marketing",          // expense: ads, promotions
      "other_expense",      // expense: anything else
    ],
    required: true,
  },

  amount: { type: Number, required: true },       // always positive
  currency: { type: String, default: "INR" },
  date: { type: Date, default: Date.now },

  // Human-readable description / memo
  description: { type: String, default: "" },

  // Optional links to other documents
  linkedBookingId: { type: String, default: "" },
  linkedInventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", default: null },
  linkedRentalId: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", default: null },

  // Client / agency info
  clientName: { type: String, default: "" },
  agencyName: { type: String, default: "" },

  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ["paid", "pending", "partial"],
    default: "paid",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "bank_transfer", "card", "other"],
    default: "cash",
  },

  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// ── NEW: Booking Model ───────────────────────────────────────────────────────
// Customer booking requests submitted from the public site
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
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
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
