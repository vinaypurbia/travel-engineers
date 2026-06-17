// TourCalculator.jsx
// Tour fare calculator — pick stops on map, choose vehicle, get Gemini-powered fare breakdown
// Uses: OpenStreetMap (Leaflet) for map — FREE
//       OSRM for routing — FREE
//       Nominatim for geocoding — FREE
//       Gemini 1.5 Flash for toll/extras analysis — FREE (uses GEMINI_API_KEY via /api/chat)
//
// Drop into your src/ folder and import wherever needed.

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Vehicle type → icon mapping ─────────────────────────────────────────────
const TYPE_ICON = { scooty: "🛵", bike: "🏍️", car: "🚗", van: "🚙", bus: "🚌", tempo: "🚌", other: "🚐" };
const getIcon = (r) => TYPE_ICON[r.type?.toLowerCase()] || "🚗";

// Default driver charges per day by vehicle type (if not set on rental)
const DEFAULT_DRIVER = { scooty: 0, bike: 0, car: 300, van: 400, bus: 600, tempo: 600 };
const BASE_CITY = "Udaipur, Rajasthan";
const WHATSAPP = "919XXXXXXXXX"; // ← update

// ─── Utility ──────────────────────────────────────────────────────────────────
const haversine = (a, b) => {
  const R = 6371, dLat = (b[0]-a[0])*Math.PI/180, dLon = (b[1]-a[1])*Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const fmtKm  = km  => km  >= 1    ? `${km.toFixed(1)} km`  : `${(km*1000).toFixed(0)} m`;
const fmtRs  = amt => `₹${Math.round(amt).toLocaleString("en-IN")}`;

// ─── Geocode via Nominatim ────────────────────────────────────────────────────
async function geocode(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Rajasthan, India")}&format=json&limit=5`,
    { headers: { "Accept-Language": "en" } }
  );
  return r.json();
}

// ─── Route via OSRM ──────────────────────────────────────────────────────────
// Fetch one leg: point A → point B, return shortest route
async function fetchLeg(from, to) {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const r = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true`
  );
  const d = await r.json();
  if (d.code !== "Ok") return null;
  // Pick the shortest route among alternatives (most cost-effective for customer)
  const best = (d.routes || []).reduce((a, b) => a.distance <= b.distance ? a : b);
  return {
    distanceKm: best.distance / 1000,
    durationMin: best.duration / 60,
    coords: best.geometry.coordinates.map(c => [c[1], c[0]]),
  };
}

async function getRoute(waypoints) {
  if (waypoints.length < 2) return null;
  // Fetch each leg separately — gives more accurate per-segment routing
  const legPromises = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    legPromises.push(fetchLeg(waypoints[i], waypoints[i + 1]));
  }
  const legs = await Promise.all(legPromises);
  if (legs.some(l => l === null)) return null;

  const totalDistanceKm = legs.reduce((sum, l) => sum + l.distanceKm, 0);
  const totalDurationMin = legs.reduce((sum, l) => sum + l.durationMin, 0);

  // Outbound = all legs except last; return = last leg (back to Udaipur)
  const outCoords = legs.slice(0, -1).flatMap(l => l.coords);
  const retCoords = legs[legs.length - 1].coords;
  const geometry  = legs.flatMap(l => l.coords);

  return {
    distanceKm: totalDistanceKm,
    durationMin: totalDurationMin,
    geometry,
    outCoords,
    retCoords,
  };
}

// ─── Gemini toll/extras analysis ─────────────────────────────────────────────
async function analyzeExtras(stops, vehicleName, distanceKm) {
  const stopList = stops.map(s => s.name).join(" → ");
  const prompt = `You are a travel cost expert for Rajasthan, India. A tourist is taking a taxi trip:
Route: ${stopList}
Vehicle: ${vehicleName}
Total distance: ${distanceKm.toFixed(1)} km

List ALL likely additional charges for this specific route in Rajasthan:
1. Toll booths (name each toll plaza and approximate charge in ₹ for this vehicle class)
2. Parking charges at each destination (₹ per visit, approximate)
3. Entry/monument fees if driver needs to enter (parking inside forts, lakes, etc.)
4. State border taxes if any
5. Any other common charges on this route

IMPORTANT DISCLAIMER to include: All charges listed are approximate estimates. Actual amounts vary and customer is liable to pay as per original receipts at each point.

Respond in this EXACT JSON format only, no markdown:
{
  "tolls": [{"name": "toll name", "amount": 45, "note": "brief note"}],
  "parking": [{"place": "place name", "amount": 50, "note": "per visit approx"}],
  "other": [{"label": "charge name", "amount": 100, "note": "brief note"}],
  "totalApprox": 350,
  "disclaimer": "All charges are approximate estimates only. Actual amounts may vary. Customer is liable to pay as per original receipts at each checkpoint.",
  "tips": "Any useful travel tips for this route"
}`;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "" }),
    });
    const d = await r.json();
    const text = (d.reply || "").replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Map component (loaded dynamically to avoid SSR issues) ───────────────────
function RouteMap({ stops, route, routeCoords, onMapClick, center }) {
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapRef.current && leafRef.current) return; // already init

    const initMap = async () => {
      // Dynamically load Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      // Dynamically load Leaflet JS
      if (!window.L) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const L = window.L;
      const map = L.map("te-tour-map", {
        center: center || [24.5854, 73.7125], zoom: 11,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 18,
      }).addTo(map);
      map.on("click", e => onMapClick([e.latlng.lat, e.latlng.lng]));
      mapRef.current  = map;
      leafRef.current = L;
    };
    initMap();
  }, []);

  // Update markers
  useEffect(() => {
    const L = leafRef.current, map = mapRef.current;
    if (!L || !map) return;
    markersRef.current.forEach(m => m.remove());
    // Build full marker list: Udaipur (S) + stops + Udaipur (E)
    const UDAIPUR        = [24.5854, 73.7125];
    const UDAIPUR_RETURN = [24.5855, 73.7126];
    const allMarkers = [
      { coords: [24.5854, 73.7110], label: "S", bg: "#4ade80", name: "Udaipur (Start)" }, // offset left so S & E are both visible
      ...stops.map((s, i) => ({ coords: s.coords, label: String(i+1), bg: "#f0c060", name: s.name })),
      { coords: UDAIPUR_RETURN,    label: "E", bg: "#f87171", name: "Udaipur (Return)" },
    ];
    markersRef.current = allMarkers.map((m) => {
      const icon = L.divIcon({
        html: `<div style="background:${m.bg};color:#06111f;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${m.label}</div>`,
        className: "", iconSize: [28,28], iconAnchor: [14,14],
      });
      return L.marker(m.coords, { icon })
        .addTo(map)
        .bindPopup(`<b>${m.name}</b>`);
    });
    if (stops.length > 0) {
      // Fit bounds to include Udaipur + all stops
      const UDAIPUR = [24.5854, 73.7125];
      const allCoords = [UDAIPUR, ...stops.map(s => s.coords)];
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [stops]);

  // Update route polyline — gold outbound, blue return
  useEffect(() => {
    const L = leafRef.current, map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) { layerRef.current.forEach?.(l => l.remove()); layerRef.current = null; }
    if (route && routeCoords && routeCoords.length > 1) {
      const out = route.outCoords?.length > 1 ? route.outCoords : routeCoords;
      const ret = route.retCoords?.length > 1 ? route.retCoords : [];
      const outLine = L.polyline(out, { color: "#d4850a", weight: 5, opacity: 0.9 }).addTo(map);
      const retLine = ret.length > 1
        ? L.polyline(ret, { color: "#60a5fa", weight: 5, opacity: 0.9, dashArray: "8,6" }).addTo(map)
        : null;
      layerRef.current = [outLine, retLine].filter(Boolean);
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [route, routeCoords]);

  return (
    <div id="te-tour-map" style={{width:"100%",height:"100%",borderRadius:12,overflow:"hidden"}}/>
  );
}

// ─── Main Calculator ──────────────────────────────────────────────────────────
export default function TourCalculator() {
  const [vehicles,    setVehicles]    = useState([]);
  const [stops,       setStops]       = useState([]);
  const [searchQ,     setSearchQ]     = useState("");
  const [searchRes,   setSearchRes]   = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [vehicle,     setVehicle]     = useState(null);
  const [days,        setDays]        = useState(1);
  const [route,       setRoute]       = useState(null);
  const [extras,      setExtras]      = useState(null);
  const [loadingRoute,setLoadingRoute]= useState(false);
  const [loadingAI,   setLoadingAI]   = useState(false);
  const [step,        setStep]        = useState(1);
  const searchTimer = useRef(null);

  // Fetch vehicles from rentals API
  useEffect(() => {
    fetch("/api/rentals").then(r=>r.json()).then(data => {
      const list = Array.isArray(data) ? data : (data.rentals || []);
      // Only show vehicles that have a pricePerKm set and are available
      const filtered = list.filter(r => r.available && Number(r.pricePerKm) > 0);
      setVehicles(filtered);
      if (filtered.length > 0) {
        // Default to first car, else first available
        const car = filtered.find(r => r.type === "car") || filtered[0];
        setVehicle(car);
      }
    }).catch(() => setVehicles([]));
  }, []);

  // Search destinations
  const handleSearch = (q) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q || q.length < 2) { setSearchRes([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await geocode(q);
      setSearchRes(res.slice(0, 5));
      setSearching(false);
    }, 400);
  };

  const addStop = useCallback((name, coords) => {
    setStops(prev => [...prev, { name, coords }]);
    setSearchQ(""); setSearchRes([]);
    setRoute(null); setExtras(null);
  }, []);

  const removeStop = (i) => {
    setStops(prev => prev.filter((_,idx) => idx !== i));
    setRoute(null); setExtras(null);
  };

  const moveStop = (i, dir) => {
    setStops(prev => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
    setRoute(null); setExtras(null);
  };

  const handleMapClick = useCallback(async (latlng) => {
    // Reverse geocode
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng[0]}&lon=${latlng[1]}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const d = await r.json();
      const name = d.name || d.display_name?.split(",")[0] || `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
      addStop(name, latlng);
    } catch {
      addStop(`Point ${stops.length+1}`, latlng);
    }
  }, [stops.length, addStop]);

  // Udaipur coordinates (fixed start & return point)
  const UDAIPUR_COORDS        = [24.5854, 73.7125];
  const UDAIPUR_RETURN_COORDS = [24.5855, 73.7126]; // tiny offset so OSRM draws the full return leg

  const calculateRoute = async () => {
    if (stops.length < 1) return;
    setLoadingRoute(true);
    const waypoints = [UDAIPUR_COORDS, ...stops.map(s => s.coords), UDAIPUR_RETURN_COORDS];
    const r = await getRoute(waypoints);
    setRoute(r);
    setLoadingRoute(false);
  };

  const calculateFare = async () => {
    if (!route || !vehicle) return;
    setLoadingAI(true);
    const stopNames = [BASE_CITY, ...stops.map(s=>s.name), BASE_CITY];
    const ex = await analyzeExtras(
      [{ name: stopNames.join(" → ") }],
      vehicle.name,
      route.distanceKm
    );
    setExtras(ex);
    setLoadingAI(false);
    setStep(3);
  };

  // Fare calculations
  const totalKm      = route ? route.distanceKm : 0; // full loop: Udaipur → stops → Udaipur
  const ratePerKm    = vehicle ? Number(vehicle.pricePerKm) || 0 : 0;
  const driverPerDay = vehicle ? (DEFAULT_DRIVER[vehicle.type?.toLowerCase()] || 0) : 0;
  const baseFare     = totalKm * ratePerKm;
  const driverCharge = driverPerDay * days;
  const extraTotal   = extras?.totalApprox || 0;
  const grandTotal   = baseFare + driverCharge + extraTotal;

  const openWhatsApp = () => {
    const stopList = stops.map(s=>s.name).join(" → ");
    const msg = `Hi! I used the Tour Calculator on your website.\n\nRoute: Udaipur → ${stopList} → Udaipur\nVehicle: ${vehicle?.name || "TBD"}\nDistance: ~${totalKm.toFixed(0)} km\nEstimated fare: ${fmtRs(grandTotal)}\n\nCan you confirm availability and booking?`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div style={{minHeight:"100vh",background:"#06111f",fontFamily:"'DM Sans',sans-serif",color:"white",padding:"0 0 60px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .tc-input{width:100%;padding:11px 14px;background:#0d1b2e;border:1.5px solid rgba(255,255,255,0.12);border-radius:10px;color:white;font-family:'DM Sans';font-size:14px;outline:none;transition:border-color 0.2s;box-sizing:border-box;}
        .tc-input:focus{border-color:#d4850a;}
        .tc-input::placeholder{color:rgba(255,255,255,0.25);}
        .tc-btn{padding:12px 24px;border:none;border-radius:10px;font-family:'DM Sans';font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;}
        .tc-btn-gold{background:linear-gradient(135deg,#d4850a,#f0c060);color:#1a1a2e;}
        .tc-btn-gold:hover{opacity:0.9;transform:translateY(-1px);}
        .tc-btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);}
        .tc-btn-ghost:hover{background:rgba(255,255,255,0.1);}
        .tc-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;}
        .tc-vehicle-card{padding:14px 16px;border-radius:12px;border:2px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.03);}
        .tc-vehicle-card:hover{border-color:rgba(212,133,10,0.4);background:rgba(212,133,10,0.05);}
        .tc-vehicle-card.selected{border-color:#d4850a;background:rgba(212,133,10,0.1);}
        .tc-step{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;}
        .tc-step.active{color:#f0c060;}
        .tc-fare-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
        .tc-fare-row:last-child{border-bottom:none;}
        .tc-pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
        .tc-search-drop{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#0d1b2e;border:1.5px solid rgba(212,133,10,0.3);border-radius:10px;z-index:100;max-height:220px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);}
        .tc-search-item{padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.15s;}
        .tc-search-item:hover{background:rgba(212,133,10,0.1);}
        .tc-disclaimer{background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:12px 14px;font-size:12px;color:rgba(251,191,36,0.8);line-height:1.6;}
        @media(max-width:768px){.tc-layout{flex-direction:column!important;}.tc-map-col{height:320px!important;}}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(180deg,#0d1b2e 0%,#06111f 100%)",padding:"32px 24px 28px",borderBottom:"1px solid rgba(212,133,10,0.15)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{fontSize:11,color:"#d4850a",fontWeight:700,textTransform:"uppercase",letterSpacing:3,marginBottom:8}}>Travel Engineers</div>
          <h1 style={{fontFamily:"'Playfair Display'",fontSize:"clamp(24px,4vw,36px)",fontWeight:700,color:"white",margin:"0 0 6px"}}>
            Tour Fare Calculator
          </h1>
          <p style={{color:"rgba(255,255,255,0.4)",margin:0,fontSize:14}}>
            Pick your destinations → choose your vehicle → get an instant fare estimate with toll & parking breakdown
          </p>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>

        {/* Step indicators */}
        <div style={{display:"flex",gap:24,marginBottom:28,flexWrap:"wrap"}}>
          {[
            {n:1,label:"Pick stops"},
            {n:2,label:"Choose vehicle"},
            {n:3,label:"Fare breakdown"},
          ].map(s=>(
            <div key={s.n} className={`tc-step${step>=s.n?" active":""}`}>
              <div style={{width:24,height:24,borderRadius:"50%",background:step>=s.n?"rgba(212,133,10,0.2)":"rgba(255,255,255,0.05)",border:`1.5px solid ${step>=s.n?"#d4850a":"rgba(255,255,255,0.12)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:step>=s.n?"#f0c060":"rgba(255,255,255,0.25)",fontWeight:700}}>
                {s.n}
              </div>
              {s.label}
            </div>
          ))}
        </div>

        {/* STEP 1: Map + stops */}
        <div className="tc-layout" style={{display:"flex",gap:20,marginBottom:24}}>

          {/* Left: stops panel */}
          <div style={{width:320,flexShrink:0}}>
            <div className="tc-card" style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>
                📍 Your route
              </div>

              {/* Fixed start */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:8,marginBottom:10}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:"#4ade80",display:"flex",alignItems:"center",justifyContent:"center",color:"#06111f",fontWeight:700,fontSize:10,flexShrink:0}}>S</span>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Udaipur (Start)</span>
              </div>

              {/* Stops list */}
              {stops.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,marginBottom:8}}>
                  <span style={{width:22,height:22,borderRadius:"50%",background:"#f0c060",color:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10,flexShrink:0}}>{i+1}</span>
                  <span style={{flex:1,fontSize:12,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                  <button onClick={()=>moveStop(i,-1)} disabled={i===0} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:i===0?"default":"pointer",padding:"0 2px",fontSize:12}}>▲</button>
                  <button onClick={()=>moveStop(i,1)} disabled={i===stops.length-1} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:i===stops.length-1?"default":"pointer",padding:"0 2px",fontSize:12}}>▼</button>
                  <button onClick={()=>removeStop(i)} style={{background:"none",border:"none",color:"rgba(248,113,113,0.6)",cursor:"pointer",padding:"0 2px",fontSize:14}}>✕</button>
                </div>
              ))}

              {/* Fixed end */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:8,marginBottom:14}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:"#f87171",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:10,flexShrink:0}}>E</span>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Udaipur (Return)</span>
              </div>

              {/* Search box */}
              <div style={{position:"relative"}}>
                <input className="tc-input" value={searchQ} onChange={e=>handleSearch(e.target.value)}
                  placeholder="Search destination to add…"/>
                {searching && <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"rgba(255,255,255,0.3)"}}>⏳</div>}
                {searchRes.length > 0 && (
                  <div className="tc-search-drop">
                    {searchRes.map((r,i)=>(
                      <div key={i} className="tc-search-item"
                        onClick={()=>addStop(r.display_name.split(",")[0], [parseFloat(r.lat), parseFloat(r.lon)])}>
                        <div style={{fontWeight:600,fontSize:13,color:"white"}}>{r.display_name.split(",")[0]}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{r.display_name.split(",").slice(1,3).join(",")}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:6}}>Or tap anywhere on the map to add a stop</div>
            </div>

            {/* Route summary */}
            {route && (
              <div className="tc-card" style={{marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:800,color:"#f0c060",fontFamily:"'Playfair Display'"}}>{fmtKm(route.distanceKm)}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginTop:2}}>Round trip (incl. return)</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:800,color:"#60a5fa",fontFamily:"'Playfair Display'"}}>{Math.round(route.durationMin/60)}h {Math.round(route.durationMin%60)}m</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginTop:2}}>Est. drive time</div>
                  </div>
                </div>
                <div style={{marginTop:10,fontSize:11,color:"rgba(255,255,255,0.25)",textAlign:"center",lineHeight:1.5}}>
                  ↕ Return route overlaps outbound on map (same road both ways)
                </div>
              </div>
            )}

            <button className="tc-btn tc-btn-gold" style={{width:"100%",marginBottom:8}}
              onClick={()=>{ calculateRoute(); setStep(s=>Math.max(s,2)); }}
              disabled={stops.length < 1 || loadingRoute}>
              {loadingRoute ? "⏳ Calculating route…" : "📐 Calculate Route"}
            </button>
          </div>

          {/* Map */}
          <div className="tc-map-col" style={{flex:1,borderRadius:14,overflow:"visible",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{height:480,borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)"}}>
              <RouteMap
                stops={stops}
                route={route}
                routeCoords={route?.geometry}
                onMapClick={handleMapClick}
                center={[24.5854, 73.7125]}
              />
            </div>
            {route && (
              <div style={{display:"flex",gap:16,justifyContent:"center",fontSize:12,color:"rgba(255,255,255,0.55)",fontFamily:"'DM Sans'"}}>
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{display:"inline-block",width:24,height:4,background:"#d4850a",borderRadius:2}}/>
                  Outbound journey
                </span>
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{display:"inline-block",width:24,height:4,background:"#60a5fa",borderRadius:2,borderTop:"2px dashed #60a5fa"}}/>
                  Return journey
                </span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Vehicle selection */}
        {step >= 2 && (
          <div className="tc-card" style={{marginBottom:24}}>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>
              🚗 Choose your vehicle
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:16}}>
              {vehicles.length === 0 && (
                <div style={{gridColumn:"1/-1",textAlign:"center",padding:32,color:"rgba(255,255,255,0.3)",fontSize:13}}>
                  No vehicles with per-km rates set yet.<br/>
                  <span style={{fontSize:11}}>Go to Rentals → Edit vehicle → Set "Rate per KM"</span>
                </div>
              )}
              {vehicles.map(v=>(
                <div key={v._id} className={`tc-vehicle-card${vehicle?._id===v._id?" selected":""}`}
                  onClick={()=>setVehicle(v)}>
                  <div style={{fontSize:28,marginBottom:6}}>{getIcon(v)}</div>
                  <div style={{fontWeight:700,fontSize:14,color:"white",marginBottom:2}}>{v.name}</div>
                  {v.vehicleNo && <div style={{fontSize:11,color:"#f0c060",marginBottom:4}}>#{v.vehicleNo}</div>}
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:8}}>
                    {v.description || v.type} {v.seats ? `· ${v.seats} seats` : ""}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#f0c060"}}>₹{v.pricePerKm}/km</span>
                    {vehicle?._id===v._id && <span style={{fontSize:10,background:"rgba(212,133,10,0.2)",color:"#f0c060",padding:"2px 8px",borderRadius:10,fontWeight:700}}>Selected</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Trip days:</span>
                <button onClick={()=>setDays(d=>Math.max(1,d-1))} style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"white",cursor:"pointer",fontSize:16}}>−</button>
                <span style={{fontWeight:700,fontSize:16,color:"white",minWidth:24,textAlign:"center"}}>{days}</span>
                <button onClick={()=>setDays(d=>d+1)} style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"white",cursor:"pointer",fontSize:16}}>+</button>
              </div>

              <button className="tc-btn tc-btn-gold" style={{marginLeft:"auto"}}
                onClick={calculateFare}
                disabled={!route || loadingAI}>
                {loadingAI ? "🔍 Analysing route with AI…" : "✨ Get Full Fare Breakdown"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Fare breakdown */}
        {step >= 3 && route && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,marginBottom:20}}>

              {/* Base fare */}
              <div className="tc-card">
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>🧮 Fare Calculation</div>

                <div className="tc-fare-row">
                  <div>
                    <div style={{fontSize:13,color:"white"}}>Base fare</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{fmtKm(totalKm)} × ₹{ratePerKm}/km</div>
                  </div>
                  <div style={{fontWeight:700,color:"#f0c060"}}>{fmtRs(baseFare)}</div>
                </div>

                {driverCharge > 0 && (
                  <div className="tc-fare-row">
                    <div>
                      <div style={{fontSize:13,color:"white"}}>Driver allowance</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>₹{driverPerDay}/day × {days} day{days>1?"s":""}</div>
                    </div>
                    <div style={{fontWeight:700,color:"#f0c060"}}>{fmtRs(driverCharge)}</div>
                  </div>
                )}

                {extras && (
                  <div className="tc-fare-row">
                    <div>
                      <div style={{fontSize:13,color:"white"}}>Tolls, parking & extras</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Approximate — pay by receipt</div>
                    </div>
                    <div style={{fontWeight:700,color:"#fb923c"}}>{fmtRs(extraTotal)}</div>
                  </div>
                )}

                <div style={{marginTop:12,padding:"14px",background:"rgba(212,133,10,0.08)",borderRadius:10,border:"1px solid rgba(212,133,10,0.2)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontWeight:700,fontSize:15,color:"white"}}>Estimated Total</div>
                    <div style={{fontWeight:800,fontSize:24,color:"#f0c060",fontFamily:"'Playfair Display'"}}>{fmtRs(grandTotal)}</div>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:4}}>Includes approximate extras · Actual may vary</div>
                </div>
              </div>

              {/* Route summary */}
              <div className="tc-card">
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>🗺️ Route Summary</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[BASE_CITY, ...stops.map(s=>s.name), BASE_CITY].map((stop,i,arr)=>(
                    <div key={i}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:i===0?"#4ade80":i===arr.length-1?"#f87171":"rgba(212,133,10,0.3)",border:"2px solid",borderColor:i===0?"#4ade80":i===arr.length-1?"#f87171":"#d4850a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:i===0||i===arr.length-1?"#06111f":"#f0c060",flexShrink:0}}>{i===0?"S":i===arr.length-1?"E":i}</div>
                        <span style={{fontSize:13,color:"white"}}>{stop}</span>
                      </div>
                      {i < arr.length-1 && <div style={{marginLeft:9,width:2,height:16,background:"rgba(255,255,255,0.1)",marginTop:2,marginBottom:2}}/>}
                    </div>
                  ))}
                </div>
                <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:700,color:"#f0c060"}}>{fmtKm(totalKm)}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>Total distance</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:700,color:"#60a5fa"}}>{vehicle ? getIcon(vehicle) : "🚗"} {vehicle?.name || "—"}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>Selected vehicle</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Extras breakdown */}
            {extras && (
              <div className="tc-card" style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>
                  🤖 AI-Estimated Additional Charges
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
                  {/* Tolls */}
                  {extras.tolls?.length > 0 && (
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fb923c",marginBottom:10}}>🚧 Toll Plazas</div>
                      {extras.tolls.map((t,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                          <div>
                            <div style={{fontSize:13,color:"white"}}>{t.name}</div>
                            {t.note && <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{t.note}</div>}
                          </div>
                          <span style={{fontWeight:700,color:"#fb923c",flexShrink:0,marginLeft:8}}>~{fmtRs(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Parking */}
                  {extras.parking?.length > 0 && (
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#a78bfa",marginBottom:10}}>🅿️ Parking</div>
                      {extras.parking.map((p,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                          <div>
                            <div style={{fontSize:13,color:"white"}}>{p.place}</div>
                            {p.note && <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{p.note}</div>}
                          </div>
                          <span style={{fontWeight:700,color:"#a78bfa",flexShrink:0,marginLeft:8}}>~{fmtRs(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Other */}
                  {extras.other?.length > 0 && (
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#34d399",marginBottom:10}}>📋 Other Charges</div>
                      {extras.other.map((o,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                          <div>
                            <div style={{fontSize:13,color:"white"}}>{o.label}</div>
                            {o.note && <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{o.note}</div>}
                          </div>
                          <span style={{fontWeight:700,color:"#34d399",flexShrink:0,marginLeft:8}}>~{fmtRs(o.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {extras.tips && (
                  <div style={{marginTop:16,padding:"12px 14px",background:"rgba(96,165,250,0.07)",borderRadius:10,border:"1px solid rgba(96,165,250,0.15)",fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>
                    💡 <strong style={{color:"#60a5fa"}}>Travel tip:</strong> {extras.tips}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="tc-disclaimer" style={{marginTop:16}}>
                  ⚠️ <strong>Important:</strong> {extras.disclaimer || "All additional charges listed above are approximate estimates only. Actual amounts may vary based on vehicle class, route conditions, and current rates. Customer is liable to pay as per original receipts at each toll, parking, or checkpoint."}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="tc-btn" style={{background:"#25d366",color:"white",flex:1,minWidth:200,fontSize:15}}
                onClick={openWhatsApp}>
                📱 Book on WhatsApp
              </button>
              <button className="tc-btn tc-btn-ghost" onClick={()=>{setStep(1);setStops([]);setRoute(null);setExtras(null);}}>
                🔄 New Calculation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
