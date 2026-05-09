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

// ── Models ──────────────────────────────────────────────────────────────────
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

module.exports = {
  connectDB,
  Agency: mongoose.models.Agency || mongoose.model("Agency", agencySchema),
  Rental: mongoose.models.Rental || mongoose.model("Rental", rentalSchema),
  Villa: mongoose.models.Villa || mongoose.model("Villa", villaSchema),
  Testimonial: mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema),
};
