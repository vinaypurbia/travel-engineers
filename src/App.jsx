const loadAllData = async () => {
  try {
    const [agency, rentals, villa, testimonials] = await Promise.all([
      api.get("/agency"),
      api.get("/rentals"),
      api.get("/villa"),
      api.get("/testimonials"),
    ]);
    setData({ agency, rentals, villa, testimonials });
  } catch (err) {
    console.error("Failed:", err);
    // Load with default data if API fails
    setData({
      agency: { name:"IslandDrift", tagline:"Ride Free. Stay Wild.", heroSubtitle:"Scooters · Cars · Bikes · Villa", phone:"+91 98765 43210", email:"hello@islanddrift.com", address:"Beach Road, Goa", whatsapp:"919876543210", heroImage:"" },
      rentals: [],
      villa: { name:"IslandDrift Villa", tagline:"Your Private Paradise", description:"A stunning villa.", price:"₹18,000", period:"/night", checkIn:"12:00 PM", checkOut:"11:00 AM", minStay:"2 nights", maxGuests:"14 guests", amenities:[], rooms:[] },
      testimonials: []
    });
  }
  setLoading(false);
};
