import { useState, useEffect } from "react";

const API = "/api";

const DEFAULT_DATA = {
  agency: { name:"IslandDrift", tagline:"Ride Free. Stay Wild. Explore More.", heroSubtitle:"Scooters · Cars · Bikes · Villa", phone:"+91 98765 43210", email:"hello@islanddrift.com", address:"Beach Road, Goa", whatsapp:"919876543210", heroImage:"https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80", stats:[{value:"500+",label:"Happy Customers"},{value:"6",label:"Villa Rooms"},{value:"2",label:"Vehicles"},{value:"24/7",label:"Support"}] },
  rentals: [],
  villa: { name:"IslandDrift Villa", tagline:"Your Private Paradise", description:"A stunning 6-room villa with private pool.", price:"₹18,000", period:"/night", checkIn:"12:00 PM", checkOut:"11:00 AM", minStay:"2 nights", maxGuests:"14 guests", image:"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", amenities:[{icon:"🏊",label:"Private Pool"},{icon:"🛏️",label:"6 Bedrooms"},{icon:"🍳",label:"Full Kitchen"},{icon:"📶",label:"WiFi"},{icon:"❄️",label:"AC"},{icon:"🔒",label:"Security"}], rooms:[{name:"Ocean Suite",beds:"King bed",guests:2,image:""},{name:"Garden Room",beds:"Queen bed",guests:2,image:""},{name:"Poolside Room",beds:"2 Twin beds",guests:2,image:""},{name:"Family Suite",beds:"King + 2 singles",guests:4,image:""},{name:"Sunset Loft",beds:"Queen bed",guests:2,image:""},{name:"Cozy Nook",beds:"Double bed",guests:2,image:""}] },
  testimonials: [{_id:"1",name:"Priya Sharma",location:"Mumbai",text:"The villa was absolutely gorgeous. Pool was clean and staff super helpful!",rating:5,approved:true},{_id:"2",name:"Rohan Mehta",location:"Bangalore",text:"Rented 3 scooties for our gang. Best decision ever!",rating:5,approved:true},{_id:"3",name:"Sarah & James",location:"London",text:"4 nights in the villa — complete paradise!",rating:5,approved:true}],
  inventory: [],
  accounting: { transactions: [], summary: { totalIncome:0, totalExpense:0, netProfit:0, breakdown:{} } },
};

const api = {
  get: (path) => fetch(`${API}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API}${path}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
  put: (path, body) => fetch(`${API}${path}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
  delete: (path) => fetch(`${API}${path}`, { method:"DELETE" }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
  patch: (path, body) => fetch(`${API}${path}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
  upload: async (file) => { const fd = new FormData(); fd.append("file", file); const r = await fetch(`${API}/upload`, { method:"POST", body:fd }); return r.json(); },
};

const Icon = ({ name, size=20 }) => {
  const icons = {
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  };
  return icons[name] || null;
};

function ImageUpload({ value, onChange, label="Image" }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload(file);
      if (result.url) onChange(result.url);
      else alert("Upload failed.");
    } catch { alert("Upload error."); }
    setUploading(false);
  };
  return (
    <div>
      <label className="adm-label">{label}</label>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <input className="adm-input" value={value||""} onChange={e=>onChange(e.target.value)} placeholder="Paste URL or upload" style={{flex:1}} />
        <label style={{ background:uploading?"rgba(255,255,255,0.05)":"rgba(212,133,10,0.15)", border:"1px solid rgba(212,133,10,0.4)", color:"#f0c060", padding:"10px 14px", borderRadius:8, cursor:uploading?"not-allowed":"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
          <Icon name="upload" size={14} />{uploading?"Uploading...":"Upload"}
          <input type="file" accept="image/*,video/*" onChange={handleFile} style={{display:"none"}} disabled={uploading} />
        </label>
      </div>
      {value && <img src={value} alt="" style={{marginTop:8,width:"100%",height:140,objectFit:"cover",borderRadius:8,opacity:0.8}} onError={e=>e.target.style.display="none"} />}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeNav, setActiveNav] = useState("home");
  const [filterType, setFilterType] = useState("all");
  const [adminTab, setAdminTab] = useState("agency");
  const [saved, setSaved] = useState(false);

  const loadAllData = async () => {
    try {
      const [agency, rentals, villa, testimonials, inventory, accounting] = await Promise.all([
        api.get("/agency"),
        api.get("/rentals"),
        api.get("/villa"),
        api.get("/testimonials"),
        api.get("/inventory"),
        api.get("/accounting"),
      ]);
      setData({ agency, rentals, villa, testimonials, inventory, accounting });
      setLoading(false);
    } catch (err) {
      console.error("API failed:", err);
      setLoading(false);
      setData(DEFAULT_DATA);
    }
  };

  useEffect(() => {
    loadAllData();
    if (window.location.pathname === "/admin") {
      setView("login");
    }
  }, []);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#faf8f3"}}>
      <div style={{width:32,height:32,border:"3px solid #eee",borderTopColor:"#d4850a",borderRadius:"50%",animation:"spin 1s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (view === "login") return <LoginScreen loginInput={loginInput} setLoginInput={setLoginInput} loginError={loginError}
    onLogin={async () => {
      try {
        const res = await api.post("/auth", { password: loginInput });
        if (res.success) { setView("admin"); setLoginError(""); setLoginInput(""); }
        else setLoginError("Wrong password!");
      } catch { setLoginError("Error connecting. Try again."); }
    }} onBack={() => setView("home")} />;

  if (view === "admin") return <AdminPanel data={data} api={api} reload={loadAllData} saved={saved} showSaved={showSaved} onExit={() => { setView("home"); loadAllData(); }} adminTab={adminTab} setAdminTab={setAdminTab} />;

  const { agency, rentals, villa, testimonials } = data;
  const filtered = filterType === "all" ? rentals : rentals.filter(r => r.type === filterType);

  return (
    <div style={{fontFamily:"'Lora',Georgia,serif",background:"#faf8f3",color:"#1a1a2e",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .hero-text{animation:fadeUp 1s ease forwards;}
        .card-hover{transition:transform 0.3s ease,box-shadow 0.3s ease;cursor:pointer;}
        .card-hover:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,0.15);}
        .btn-primary{background:linear-gradient(135deg,#d4850a,#f0c060);color:#1a1a2e;border:none;padding:14px 32px;border-radius:50px;font-family:'DM Sans';font-weight:600;font-size:15px;cursor:pointer;transition:all 0.3s;}
        .btn-primary:hover{transform:scale(1.04);box-shadow:0 8px 30px rgba(212,133,10,0.5);}
        .btn-outline{background:transparent;color:white;border:2px solid rgba(255,255,255,0.7);padding:12px 28px;border-radius:50px;font-family:'DM Sans';font-weight:500;cursor:pointer;transition:all 0.3s;font-size:15px;}
        .btn-outline:hover{background:white;color:#1a1a2e;}
        .tag{background:linear-gradient(135deg,#d4850a,#f0c060);color:#1a1a2e;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;font-family:'DM Sans';letter-spacing:1px;text-transform:uppercase;}
        .nav-link{font-family:'DM Sans';font-weight:500;font-size:14px;text-transform:uppercase;letter-spacing:2px;cursor:pointer;transition:color 0.2s;}
        .section-title{font-family:'Playfair Display',serif;font-size:clamp(32px,5vw,52px);font-weight:900;line-height:1.1;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-thumb{background:#d4850a;border-radius:3px;}
      `}</style>

      {/* NAVBAR */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"0 5%",height:70,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,22,40,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(212,133,10,0.2)"}}>
        <div style={{fontFamily:"'Playfair Display'",fontWeight:900,fontSize:24,color:"#f0c060",cursor:"pointer"}} onClick={()=>document.getElementById("sec-home")?.scrollIntoView({behavior:"smooth"})}>
          {agency.name}
        </div>
        <div style={{display:"flex",gap:28,alignItems:"center"}}>
          {["home","rentals","villa","contact"].map(n=>(
            <span key={n} className="nav-link" style={{color:activeNav===n?"#f0c060":"rgba(255,255,255,0.7)"}}
              onClick={()=>{setActiveNav(n);document.getElementById(`sec-${n}`)?.scrollIntoView({behavior:"smooth"});}}>
              {n}
            </span>
          ))}
          <button onClick={()=>setView("login")} style={{background:"rgba(212,133,10,0.2)",border:"1px solid #d4850a",color:"#f0c060",padding:"7px 16px",borderRadius:20,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:12,fontWeight:600}}>ADMIN</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="sec-home" style={{height:"100vh",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${agency.heroImage||"https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80"})`,backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.4)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(10,22,40,0.9))"}} />
        <div style={{position:"relative",textAlign:"center",color:"white",padding:"0 20px",maxWidth:800}}>
          <div className="hero-text" style={{fontFamily:"'DM Sans'",fontSize:13,letterSpacing:4,color:"#f0c060",marginBottom:18,textTransform:"uppercase"}}>{agency.heroSubtitle}</div>
          <h1 className="hero-text" style={{fontFamily:"'Playfair Display'",fontSize:"clamp(42px,8vw,88px)",fontWeight:900,lineHeight:1.05,marginBottom:20,animationDelay:"0.2s"}}>{agency.name}</h1>
          <p className="hero-text" style={{fontFamily:"'Lora'",fontSize:"clamp(16px,2vw,22px)",color:"rgba(255,255,255,0.8)",marginBottom:40,fontStyle:"italic",animationDelay:"0.4s"}}>{agency.tagline}</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-primary" onClick={()=>document.getElementById("sec-rentals")?.scrollIntoView({behavior:"smooth"})}>Explore Rentals →</button>
            <button className="btn-outline" onClick={()=>document.getElementById("sec-villa")?.scrollIntoView({behavior:"smooth"})}>View Villa</button>
          </div>
        </div>
      </section>

      {/* STATS */}
      {(() => {
        const happyCustomers = testimonials.filter(t => t.approved && t.rating >= 3).length;
        const villaRooms = (villa.rooms || []).length;
        const vehicles = rentals.filter(r => r.available).length;
        const dynamicStats = [
          { value: happyCustomers > 0 ? happyCustomers + "+" : "0", label: "Happy Customers" },
          { value: villaRooms || 0, label: "Villa Rooms" },
          { value: vehicles || 0, label: "Vehicles" },
          { value: "24/7", label: "Support" }];
        return (
          <div style={{background:"#0a1628",padding:"28px 5%",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:20}}>
            {dynamicStats.map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Playfair Display'",fontSize:32,fontWeight:900,color:"#f0c060"}}>{s.value}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* RENTALS */}
      <section id="sec-rentals" style={{padding:"100px 5%"}}>
        <div style={{textAlign:"center",marginBottom:60}}>
          <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#d4850a",textTransform:"uppercase",marginBottom:12}}>Explore on Wheels</div>
          <h2 className="section-title">Rent Your Ride</h2>
          <p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"#666",marginTop:16,fontSize:18}}>Scooters, bikes, and cars — your choice, your pace</p>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:48,flexWrap:"wrap"}}>
          {["all","scooty","bike","car"].map(f=>(
            <button key={f} onClick={()=>setFilterType(f)} style={{padding:"10px 24px",borderRadius:30,border:"2px solid",fontFamily:"'DM Sans'",fontWeight:600,fontSize:13,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",borderColor:filterType===f?"#d4850a":"#ddd",background:filterType===f?"#d4850a":"transparent",color:filterType===f?"white":"#555"}}>
              {f==="all"?"All":f==="scooty"?"🛵 Scooties":f==="bike"?"🏍️ Bikes":"🚗 Cars"}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",color:"#999",fontFamily:"'DM Sans'",padding:60}}>
            <div style={{fontSize:48,marginBottom:16}}>🛵</div>
            No vehicles listed yet. Add them from the Admin Panel!
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:28}}>
            {filtered.filter(r=>r.available).map(rental=>(
              <div key={rental._id} className="card-hover" style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>
                <div style={{height:200,backgroundImage:`url(${rental.image||"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)"}} />
                  {rental.tag&&<div style={{position:"absolute",top:16,left:16}}><span className="tag">{rental.tag}</span></div>}
                </div>
                <div style={{padding:"22px 24px 24px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <h3 style={{fontFamily:"'Playfair Display'",fontSize:22,fontWeight:700}}>{rental.name}</h3>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontFamily:"'Playfair Display'",fontSize:22,fontWeight:700,color:"#d4850a"}}>{rental.price}</span>
                      <span style={{fontFamily:"'DM Sans'",fontSize:12,color:"#999"}}>{rental.period}</span>
                    </div>
                  </div>
                  {rental.description&&<p style={{fontFamily:"'Lora'",fontSize:14,color:"#666",marginBottom:16,lineHeight:1.6,fontStyle:"italic"}}>{rental.description}</p>}
                  {(rental.features||[]).length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
                      {rental.features.filter(Boolean).map((f,i)=><span key={i} style={{fontSize:12,background:"#f5f0e8",color:"#8b6914",padding:"4px 10px",borderRadius:20,fontFamily:"'DM Sans'"}}>{f}</span>)}
                    </div>
                  )}
                  <a href={`https://wa.me/${agency.whatsapp}?text=Hi! I'd like to book the ${rental.name}`} target="_blank" rel="noreferrer">
                    <button className="btn-primary" style={{width:"100%",padding:"12px",fontSize:14}}>Book Now → WhatsApp</button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VILLA */}
      <section id="sec-villa" style={{padding:"100px 5%",background:"#0a1628",color:"white"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:60}}>
            <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#f0c060",textTransform:"uppercase",marginBottom:12}}>Private Luxury</div>
            <h2 className="section-title" style={{color:"white"}}>{villa.name}</h2>
            {villa.tagline&&<p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"rgba(255,255,255,0.6)",marginTop:16,fontSize:18}}>{villa.tagline}</p>}
          </div>
          {villa.image&&<div style={{borderRadius:24,overflow:"hidden",marginBottom:48,height:400,backgroundImage:`url(${villa.image})`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,marginBottom:48}}>
            <div>
              {villa.description&&<p style={{fontFamily:"'Lora'",fontSize:17,lineHeight:1.8,color:"rgba(255,255,255,0.75)",marginBottom:28}}>{villa.description}</p>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[["Check-in",villa.checkIn],["Check-out",villa.checkOut],["Min stay",villa.minStay],["Max guests",villa.maxGuests]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"16px"}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:"#f0c060",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                    <div style={{fontFamily:"'Playfair Display'",fontSize:18,fontWeight:700}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontFamily:"'DM Sans'",fontSize:11,letterSpacing:3,color:"#f0c060",textTransform:"uppercase",marginBottom:20}}>Amenities</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {(villa.amenities||[]).map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px"}}>
                    <span style={{fontSize:20}}>{a.icon}</span>
                    <span style={{fontFamily:"'DM Sans'",fontSize:14,color:"rgba(255,255,255,0.8)"}}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {(villa.rooms||[]).length>0&&(
            <>
              <div style={{fontFamily:"'DM Sans'",fontSize:11,letterSpacing:3,color:"#f0c060",textTransform:"uppercase",marginBottom:24}}>Rooms</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16,marginBottom:48}}>
                {villa.rooms.map((r,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(240,192,96,0.1)",borderRadius:14,overflow:"hidden"}}>
                    {r.image&&<div style={{height:120,backgroundImage:`url(${r.image})`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
                    <div style={{padding:"14px"}}>
                      <div style={{fontFamily:"'Playfair Display'",fontSize:16,fontWeight:700,marginBottom:4}}>{r.name}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"rgba(255,255,255,0.5)"}}>{r.beds} · up to {r.guests} guests</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display'",fontSize:36,fontWeight:900,color:"#f0c060",marginBottom:8}}>{villa.price}<span style={{fontSize:16,color:"rgba(255,255,255,0.4)",fontFamily:"'DM Sans'"}}>{villa.period}</span></div>
            <a href={`https://wa.me/${agency.whatsapp}?text=Hi! I'd like to book the ${villa.name}`} target="_blank" rel="noreferrer">
              <button className="btn-primary" style={{fontSize:16,padding:"16px 48px",marginTop:16}}>Book Villa → WhatsApp</button>
            </a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"100px 5%"}}>
        <div style={{textAlign:"center",marginBottom:60}}>
          <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#d4850a",textTransform:"uppercase",marginBottom:12}}>What People Say</div>
          <h2 className="section-title">Guest Reviews</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:24,marginBottom:60}}>
          {testimonials.filter(t=>t.approved).map(t=>(
            <div key={t._id} className="card-hover" style={{background:"white",borderRadius:20,padding:"32px 28px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",gap:4,marginBottom:16}}>
                {[...Array(t.rating)].map((_,i)=><span key={i} style={{color:"#f0c060"}}><Icon name="star" size={16} /></span>)}
              </div>
              <p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"#444",lineHeight:1.7,marginBottom:20}}>"{t.text}"</p>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontFamily:"'DM Sans'",fontWeight:600}}>{t.name}</div>
                  {t.category==="villa" && <span style={{fontSize:11,background:"#e8f4fd",color:"#3182ce",padding:"2px 8px",borderRadius:10,fontWeight:600}}>🏡 Villa</span>}
                  {t.category==="rental" && <span style={{fontSize:11,background:"#f0fff4",color:"#38a169",padding:"2px 8px",borderRadius:10,fontWeight:600}}>{t.vehicleType==="scooty"?"🛵":t.vehicleType==="bike"?"🏍️":"🚗"} {t.vehicleName||"Rental"}</span>}
                </div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"#999"}}>{t.location}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{maxWidth:600,margin:"0 auto",background:"white",borderRadius:24,padding:"40px",boxShadow:"0 4px 30px rgba(0,0,0,0.08)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#d4850a",textTransform:"uppercase",marginBottom:8}}>Share Your Experience</div>
            <h3 style={{fontFamily:"'Playfair Display'",fontSize:28,fontWeight:900,color:"#1a1a2e"}}>Leave a Review</h3>
          </div>
          <ReviewForm api={api} reload={loadAllData} rentals={rentals} villa={villa} />
        </div>
      </section>

      {/* CONTACT */}
      <section id="sec-contact" style={{background:"#0a1628",padding:"100px 5%",color:"white"}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <h2 className="section-title" style={{color:"white",marginBottom:20}}>Contact Us</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:24,marginBottom:48}}>
            {[{icon:"📞",label:"Call / WhatsApp",value:agency.phone,href:`tel:${agency.phone}`},{icon:"✉️",label:"Email",value:agency.email,href:`mailto:${agency.email}`},{icon:"📍",label:"Location",value:agency.address,href:"#"}].map(c=>(
              <a key={c.label} href={c.href} style={{textDecoration:"none",display:"block",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:"28px 20px"}}>
                <div style={{fontSize:30,marginBottom:12}}>{c.icon}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"#f0c060",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{c.label}</div>
                <div style={{fontFamily:"'Lora'",color:"rgba(255,255,255,0.75)",fontSize:14,lineHeight:1.5}}>{c.value}</div>
              </a>
            ))}
          </div>
          <a href={`https://wa.me/${agency.whatsapp}`} target="_blank" rel="noreferrer">
            <button className="btn-primary" style={{fontSize:16,padding:"16px 48px"}}>💬 Chat on WhatsApp</button>
          </a>
        </div>
      </section>

      <footer style={{background:"#060e1a",padding:"30px 5%",textAlign:"center",borderTop:"1px solid rgba(240,192,96,0.1)"}}>
        <div style={{fontFamily:"'Playfair Display'",fontSize:20,color:"#f0c060",marginBottom:8}}>{agency.name}</div>
        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"rgba(255,255,255,0.3)",letterSpacing:2}}>
          © {new Date().getFullYear()} · <span style={{cursor:"pointer",color:"rgba(240,192,96,0.4)"}} onClick={()=>setView("login")}>Admin</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Review Form (public) ────────────────────────────────────────────────────
function ReviewForm({ api, reload, rentals, villa }) {
  const emptyForm = { name:"", location:"", text:"", rating:5, category:"villa", vehicleType:"", vehicleId:"" };
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const scooties = (rentals||[]).filter(r=>r.available && r.type==="scooty");
  const bikes    = (rentals||[]).filter(r=>r.available && r.type==="bike");
  const cars     = (rentals||[]).filter(r=>r.available && r.type==="car");
  const vehicleGroups = [
    { type:"scooty", icon:"🛵", label:"Scooties", items: scooties },
    { type:"bike",   icon:"🏍️", label:"Bikes",    items: bikes },
    { type:"car",    icon:"🚗", label:"Cars",     items: cars },
  ].filter(g=>g.items.length > 0);
  const setCategory = (cat) => setForm(f=>({...f, category:cat, vehicleType:"", vehicleId:""}));
  const setVehicleType = (vt) => setForm(f=>({...f, vehicleType:vt, vehicleId:""}));
  const submit = async () => {
    if (!form.name.trim() || !form.text.trim()) { alert("Please fill in your name and review."); return; }
    if (form.category==="rental" && !form.vehicleId) { alert("Please select which vehicle you rented."); return; }
    setStatus("sending");
    const selectedVehicle = form.vehicleId ? (rentals||[]).find(r=>r._id===form.vehicleId) : null;
    const payload = { name:form.name, location:form.location, text:form.text, rating:form.rating, approved:false, category:form.category, vehicleType:form.vehicleType||null, vehicleName:selectedVehicle?selectedVehicle.name:null, vehicleId:form.vehicleId||null };
    try { await api.post("/testimonials", payload); await reload(); setStatus("done"); setForm(emptyForm); }
    catch { setStatus("error"); }
  };
  const inputStyle = {width:"100%",padding:"12px 14px",border:"1.5px solid #e8e8e8",borderRadius:10,fontFamily:"'DM Sans'",fontSize:14,outline:"none",color:"#1a1a2e",transition:"border-color 0.2s",background:"white"};
  const labelStyle = {display:"block",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,color:"#999",textTransform:"uppercase",letterSpacing:2,marginBottom:6};
  if (status === "done") return (
    <div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:48,marginBottom:16}}>🙏</div>
      <h4 style={{fontFamily:"'Playfair Display'",fontSize:22,marginBottom:8,color:"#1a1a2e"}}>Thank you!</h4>
      <p style={{fontFamily:"'Lora'",color:"#888",fontSize:15,fontStyle:"italic",lineHeight:1.6}}>Your review is pending approval. We truly appreciate it!</p>
      <button onClick={()=>setStatus(null)} style={{marginTop:20,background:"transparent",border:"1px solid #ddd",color:"#555",padding:"8px 20px",borderRadius:20,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13}}>Write another</button>
    </div>
  );
  return (
    <div>
      <div style={{marginBottom:20}}>
        <label style={labelStyle}>I visited the</label>
        <div style={{display:"flex",gap:10}}>
          {[["villa","🏡 Villa"],["rental","🛵 Rental Vehicle"]].map(([val,lbl])=>(
            <button key={val} onClick={()=>setCategory(val)} style={{flex:1,padding:"10px",border:`2px solid ${form.category===val?"#d4850a":"#eee"}`,borderRadius:10,background:form.category===val?"rgba(212,133,10,0.08)":"white",color:form.category===val?"#d4850a":"#666",fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lbl}</button>
          ))}
        </div>
      </div>
      {form.category==="rental" && vehicleGroups.length>0 && (
        <div style={{marginBottom:20}}>
          <label style={labelStyle}>Vehicle type</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {vehicleGroups.map(g=>(
              <button key={g.type} onClick={()=>setVehicleType(g.type)} style={{padding:"8px 16px",border:`2px solid ${form.vehicleType===g.type?"#d4850a":"#eee"}`,borderRadius:20,background:form.vehicleType===g.type?"rgba(212,133,10,0.08)":"white",color:form.vehicleType===g.type?"#d4850a":"#666",fontFamily:"'DM Sans'",fontSize:13,cursor:"pointer"}}>{g.icon} {g.label}</button>
            ))}
          </div>
          {form.vehicleType && (
            <select value={form.vehicleId} onChange={e=>set("vehicleId",e.target.value)} style={{...inputStyle}}>
              <option value="">Select specific vehicle…</option>
              {vehicleGroups.find(g=>g.type===form.vehicleType)?.items.map(v=><option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          )}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div><label style={labelStyle}>Your name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Priya Sharma" style={inputStyle}/></div>
        <div><label style={labelStyle}>From (city)</label><input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Mumbai" style={inputStyle}/></div>
      </div>
      <div style={{marginBottom:20}}>
        <label style={labelStyle}>Rating</label>
        <div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>set("rating",n)} style={{fontSize:24,background:"none",border:"none",cursor:"pointer",opacity:n<=form.rating?1:0.3}}>★</button>)}</div>
      </div>
      <div style={{marginBottom:24}}>
        <label style={labelStyle}>Your Review *</label>
        <textarea value={form.text} onChange={e=>set("text",e.target.value)} rows={4} style={{...inputStyle,fontFamily:"'Lora'",resize:"vertical",lineHeight:1.6}} placeholder="Tell us about your experience…"/>
      </div>
      {status==="error"&&<p style={{color:"#e53e3e",fontSize:13,marginBottom:12}}>Something went wrong. Please try again.</p>}
      <button onClick={submit} disabled={status==="sending"} style={{width:"100%",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"14px",borderRadius:12,fontFamily:"'DM Sans'",fontWeight:700,fontSize:15,cursor:status==="sending"?"not-allowed":"pointer",opacity:status==="sending"?0.7:1}}>
        {status==="sending" ? "Submitting..." : "Submit Review →"}
      </button>
      <p style={{textAlign:"center",fontFamily:"'DM Sans'",fontSize:12,color:"#bbb",marginTop:12}}>Reviews are published after approval</p>
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ loginInput, setLoginInput, loginError, onLogin, onBack }) {
  return (
    <div style={{minHeight:"100vh",background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{width:56,height:56,background:"rgba(212,133,10,0.15)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:"#f0c060"}}><Icon name="lock" size={24} /></div>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,color:"white",marginBottom:24}}>Admin Access</h2>
        <input type="password" placeholder="Password" value={loginInput} onChange={e=>setLoginInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()}
          style={{width:"100%",padding:"14px 18px",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"white",fontFamily:"'DM Sans'",fontSize:15,outline:"none",marginBottom:12}} />
        {loginError&&<p style={{color:"#ff6b6b",fontSize:13,marginBottom:12}}>{loginError}</p>}
        <button onClick={onLogin} style={{width:"100%",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:14,borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:12}}>Login</button>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer"}}>← Back to website</button>
      </div>
    </div>
  );
}

// ─── Admin Panel Shell ───────────────────────────────────────────────────────
function AdminPanel({ data, api, reload, saved, showSaved, onExit, adminTab, setAdminTab }) {
  const tabs = [
    {id:"agency",      label:"🏢 Agency Info"},
    {id:"rentals",     label:"🛵 Rentals"},
    {id:"villa",       label:"🏡 Villa"},
    {id:"testimonials",label:"⭐ Reviews"},
    {id:"inventory",   label:"📦 Inventory"},
    {id:"accounting",  label:"💰 Accounting"},
  ];
  return (
    <div style={{minHeight:"100vh",background:"#0d1b2e",fontFamily:"'DM Sans',sans-serif",color:"white"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .adm-input{width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-family:'DM Sans';font-size:14px;outline:none;transition:border-color 0.2s;}
        .adm-input:focus{border-color:#d4850a;}
        textarea.adm-input{resize:vertical;min-height:80px;line-height:1.6;}
        label.adm-label{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
        .adm-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;}
        select.adm-input{cursor:pointer;}
        .adm-stat{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;}
      `}</style>
      <div style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(240,192,96,0.15)",padding:"0 32px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'Playfair Display'",fontSize:20,color:"#f0c060"}}>Admin Panel</span>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {saved&&<span style={{color:"#4ade80",fontSize:13,display:"flex",alignItems:"center",gap:6}}><Icon name="check" size={16}/> Saved!</span>}
          <button onClick={onExit} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.7)",padding:"8px 18px",borderRadius:20,cursor:"pointer",fontSize:13}}>← View Site</button>
        </div>
      </div>
      <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
        <div style={{width:220,background:"rgba(0,0,0,0.2)",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"24px 0",flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{width:"100%",padding:"14px 24px",textAlign:"left",background:adminTab===t.id?"rgba(212,133,10,0.15)":"transparent",border:"none",borderLeft:`3px solid ${adminTab===t.id?"#d4850a":"transparent"}`,color:adminTab===t.id?"#f0c060":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:14,fontFamily:"'DM Sans'",fontWeight:500}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{flex:1,padding:"32px",overflowY:"auto"}}>
          {adminTab==="agency"       && <AgencyEditor       data={data} api={api} showSaved={showSaved}/>}
          {adminTab==="rentals"      && <RentalsEditor      data={data} api={api} reload={reload} showSaved={showSaved}/>}
          {adminTab==="villa"        && <VillaEditor        data={data} api={api} showSaved={showSaved}/>}
          {adminTab==="testimonials" && <TestimonialsEditor data={data} api={api} reload={reload} showSaved={showSaved}/>}
          {adminTab==="inventory"    && <InventoryEditor    data={data} api={api} reload={reload} showSaved={showSaved}/>}
          {adminTab==="accounting"   && <AccountingEditor   data={data} api={api} reload={reload} showSaved={showSaved}/>}
        </div>
      </div>
    </div>
  );
}

// ─── Agency Editor (unchanged) ───────────────────────────────────────────────
function AgencyEditor({ data, api, showSaved }) {
  const [form, setForm] = useState(data.agency);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => { await api.put("/agency", form); showSaved(); };
  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,marginBottom:24}}>Agency Information</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {[["Agency Name","name"],["Tagline","tagline"],["Hero Subtitle","heroSubtitle"],["Phone","phone"],["Email","email"],["WhatsApp Number","whatsapp"]].map(([l,k])=>(
          <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
        ))}
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Address</label><input className="adm-input" value={form.address||""} onChange={e=>set("address",e.target.value)}/></div>
        <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Hero Image" value={form.heroImage} onChange={v=>set("heroImage",v)}/></div>
      </div>
      <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Save Changes</button>
    </div>
  );
}

// ─── Rentals Editor (unchanged) ──────────────────────────────────────────────
function RentalsEditor({ data, api, reload, showSaved }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const blank = {type:"scooty",name:"",category:"Scooty",price:"",period:"/day",tag:"",description:"",features:[""],image:"",available:true};
  const startEdit = (r) => { setForm({...r,features:[...(r.features||[])]}); setEditId(r._id); setAdding(false); };
  const startAdd = () => { setForm({...blank}); setEditId(null); setAdding(true); };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const saveRental = async () => {
    if (adding) await api.post("/rentals", form);
    else await api.put(`/rentals/${editId}`, form);
    await reload(); showSaved(); setEditId(null); setForm(null); setAdding(false);
  };
  const deleteRental = async (id) => { if(window.confirm("Delete?")){ await api.delete(`/rentals/${id}`); await reload(); } };
  const toggleAvail = async (r) => { await api.put(`/rentals/${r._id}`,{...r,available:!r.available}); await reload(); };
  const btnStyle = (color) => ({background:`rgba(${color},0.15)`,border:`1px solid rgba(${color},0.3)`,color:`rgb(${color})`,padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12});
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Rental Vehicles</h2>
        <button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Vehicle</button>
      </div>
      {(editId||adding)&&form&&(
        <div className="adm-card" style={{marginBottom:28,border:"1px solid rgba(212,133,10,0.3)"}}>
          <h3 style={{marginBottom:20,color:"#f0c060"}}>{adding?"Add New Vehicle":"Edit Vehicle"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            {[["Vehicle Name","name"],["Price","price"],["Period","period"],["Tag (optional)","tag"]].map(([l,k])=>(
              <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
            ))}
            <div><label className="adm-label">Type</label>
              <select className="adm-input" value={form.type} onChange={e=>set("type",e.target.value)}>
                <option value="scooty">Scooty</option><option value="bike">Bike</option><option value="car">Car</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:22}}>
              <label className="adm-label" style={{marginBottom:0}}>Available</label>
              <input type="checkbox" checked={!!form.available} onChange={e=>set("available",e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:"#d4850a"}}/>
            </div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)}/></div>
            <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Vehicle Image" value={form.image} onChange={v=>set("image",v)}/></div>
          </div>
          <div style={{marginBottom:16}}>
            <label className="adm-label">Features</label>
            {(form.features||[]).map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                <input className="adm-input" value={f} onChange={e=>{const arr=[...(form.features||[])];arr[i]=e.target.value;set("features",arr);}} placeholder="e.g. Helmet included"/>
                <button onClick={()=>{const arr=(form.features||[]).filter((_,j)=>j!==i);set("features",arr);}} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"8px 12px",borderRadius:8,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
              </div>
            ))}
            <button onClick={()=>set("features",[...(form.features||[]),""])} style={{fontSize:13,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",padding:"8px 16px",borderRadius:8,cursor:"pointer",marginTop:4}}>+ Add Feature</button>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={saveRental} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>{setEditId(null);setForm(null);setAdding(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:12}}>
        {(data.rentals||[]).length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48}}>No vehicles yet. Add one above!</div>}
        {(data.rentals||[]).map(r=>(
          <div key={r._id} className="adm-card" style={{display:"flex",gap:16,alignItems:"center"}}>
            {r.image&&<img src={r.image} alt="" style={{width:64,height:64,objectFit:"cover",borderRadius:10,flexShrink:0}}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:600,fontSize:15}}>{r.name}</span>
                <span style={{fontSize:11,background:"rgba(255,255,255,0.08)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.5)"}}>{r.type}</span>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:r.available?"rgba(74,222,128,0.1)":"rgba(255,80,80,0.1)",color:r.available?"#4ade80":"#ff6b6b"}}>{r.available?"Available":"Unavailable"}</span>
              </div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>{r.price}{r.period}</div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>toggleAvail(r)} style={btnStyle(r.available?"255,80,80":"74,222,128")}>{r.available?"Hide":"Show"}</button>
              <button onClick={()=>startEdit(r)} style={btnStyle("212,133,10")}>Edit</button>
              <button onClick={()=>deleteRental(r._id)} style={btnStyle("255,80,80")}><Icon name="trash" size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Villa Editor (unchanged) ────────────────────────────────────────────────
function VillaEditor({ data, api, showSaved }) {
  const [form, setForm] = useState({...data.villa});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => { await api.put("/villa", form); showSaved(); };
  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,marginBottom:24}}>Villa Details</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {[["Villa Name","name"],["Tagline","tagline"],["Price","price"],["Period","period"],["Check-in","checkIn"],["Check-out","checkOut"],["Min Stay","minStay"],["Max Guests","maxGuests"]].map(([l,k])=>(
          <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
        ))}
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)}/></div>
        <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Villa Image" value={form.image} onChange={v=>set("image",v)}/></div>
      </div>
      <div style={{marginBottom:20}}>
        <label className="adm-label">Amenities</label>
        {(form.amenities||[]).map((a,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
            <input className="adm-input" value={a.icon||""} onChange={e=>{const arr=[...(form.amenities||[])];arr[i]={...arr[i],icon:e.target.value};set("amenities",arr);}} placeholder="🏊" style={{width:60}}/>
            <input className="adm-input" value={a.label||""} onChange={e=>{const arr=[...(form.amenities||[])];arr[i]={...arr[i],label:e.target.value};set("amenities",arr);}} placeholder="Pool"/>
            <button onClick={()=>set("amenities",(form.amenities||[]).filter((_,j)=>j!==i))} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"8px 12px",borderRadius:8,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
          </div>
        ))}
        <button onClick={()=>set("amenities",[...(form.amenities||[]),{icon:"",label:""}])} style={{fontSize:13,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>+ Add Amenity</button>
      </div>
      <div style={{marginBottom:24}}>
        <label className="adm-label">Rooms</label>
        {(form.rooms||[]).map((r,i)=>(
          <div key={i} className="adm-card" style={{marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
              <div><label className="adm-label">Room Name</label><input className="adm-input" value={r.name||""} onChange={e=>{const arr=[...(form.rooms||[])];arr[i]={...arr[i],name:e.target.value};set("rooms",arr);}}/></div>
              <div><label className="adm-label">Beds</label><input className="adm-input" value={r.beds||""} onChange={e=>{const arr=[...(form.rooms||[])];arr[i]={...arr[i],beds:e.target.value};set("rooms",arr);}}/></div>
              <div><label className="adm-label">Max Guests</label><input className="adm-input" type="number" value={r.guests||""} onChange={e=>{const arr=[...(form.rooms||[])];arr[i]={...arr[i],guests:Number(e.target.value)};set("rooms",arr);}}/></div>
              <div><ImageUpload label="Room Image" value={r.image} onChange={v=>{const arr=[...(form.rooms||[])];arr[i]={...arr[i],image:v};set("rooms",arr);}}/></div>
            </div>
            <button onClick={()=>set("rooms",(form.rooms||[]).filter((_,j)=>j!==i))} style={{fontSize:12,color:"#ff6b6b",background:"transparent",border:"1px solid rgba(255,80,80,0.2)",padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>Remove Room</button>
          </div>
        ))}
        <button onClick={()=>set("rooms",[...(form.rooms||[]),{name:"",beds:"",guests:2,image:""}])} style={{fontSize:13,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>+ Add Room</button>
      </div>
      <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Save Changes</button>
    </div>
  );
}

// ─── Testimonials Editor (unchanged) ─────────────────────────────────────────
function TestimonialsEditor({ data, api, reload, showSaved }) {
  const [tab, setTab] = useState("approved");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [localList, setLocalList] = useState(data.testimonials||[]);
  useEffect(()=>setLocalList(data.testimonials||[]),[data.testimonials]);
  const approved = localList.filter(t=>t.approved);
  const pending  = localList.filter(t=>!t.approved);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const startEdit = (t) => { setForm({...t}); setEditId(t._id); };
  const startAdd  = () => { setForm({name:"",location:"",text:"",rating:5,approved:true,category:"villa"}); setEditId("new"); };
  const save = async () => {
    if (editId==="new") await api.post("/testimonials", form);
    else await api.put(`/testimonials/${editId}`, form);
    setEditId(null); setForm(null); showSaved(); await reload();
  };
  const del = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    setLocalList(l=>l.filter(t=>t._id!==id));
    await api.delete(`/testimonials/${id}`);
    await reload();
  };
  const approve = async (t) => {
    setActionId(t._id+"_approve");
    setLocalList(l=>l.map(r=>r._id===t._id?{...r,approved:true}:r));
    try { await api.put(`/testimonials/${t._id}`,{...t,approved:true}); showSaved(); await reload(); }
    catch(err) { setLocalList(l=>l.map(r=>r._id===t._id?{...r,approved:false}:r)); alert("Approve failed: "+err.message); }
    setActionId(null);
  };
  const reject = async (t) => {
    setActionId(t._id+"_reject");
    setLocalList(l=>l.map(r=>r._id===t._id?{...r,approved:false}:r));
    try { await api.put(`/testimonials/${t._id}`,{...t,approved:false}); await reload(); }
    catch(err) { setLocalList(l=>l.map(r=>r._id===t._id?{...r,approved:true}:r)); alert("Hide failed: "+err.message); }
    setActionId(null);
  };
  const list = tab==="approved" ? approved : pending;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Reviews</h2>
        <button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Review</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["approved","✅ Approved","#4ade80"],["pending","⏳ Pending Approval","#f0c060"]].map(([id,label,col])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 20px",borderRadius:20,border:`2px solid ${tab===id?col:"rgba(255,255,255,0.1)"}`,background:tab===id?`rgba(${id==="approved"?"74,222,128":"240,192,96"},0.1)`:"transparent",color:tab===id?col:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontWeight:600}}>
            {label} ({id==="approved"?approved.length:pending.length})
          </button>
        ))}
      </div>
      {pending.length>0&&tab==="approved"&&(
        <div style={{background:"rgba(240,192,96,0.08)",border:"1px solid rgba(240,192,96,0.3)",borderRadius:12,padding:"12px 18px",marginBottom:20,fontSize:13,color:"#f0c060"}}>
          ⚠️ You have <strong>{pending.length}</strong> review{pending.length>1?"s":""} waiting for approval
        </div>
      )}
      {editId&&form&&(
        <div className="adm-card" style={{marginBottom:24,border:"1px solid rgba(212,133,10,0.3)"}}>
          <h3 style={{color:"#f0c060",marginBottom:18}}>{editId==="new"?"New Review":"Edit Review"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label className="adm-label">Name</label><input className="adm-input" value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
            <div><label className="adm-label">Location</label><input className="adm-input" value={form.location||""} onChange={e=>set("location",e.target.value)}/></div>
            <div><label className="adm-label">Rating</label>
              <select className="adm-input" value={form.rating} onChange={e=>set("rating",Number(e.target.value))}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:22}}>
              <label className="adm-label" style={{marginBottom:0}}>Approved</label>
              <input type="checkbox" checked={!!form.approved} onChange={e=>set("approved",e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:"#d4850a"}}/>
            </div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Review Text</label><textarea className="adm-input" value={form.text||""} onChange={e=>set("text",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>{setEditId(null);setForm(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:12}}>
        {list.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48,fontSize:14}}>{tab==="pending"?"No reviews waiting 🎉":"No approved reviews yet"}</div>}
        {list.map(t=>(
          <div key={t._id} className="adm-card" style={{display:"flex",gap:16,alignItems:"flex-start",border:tab==="pending"?"1px solid rgba(240,192,96,0.2)":"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontWeight:600}}>{t.name}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{t.location}</span>
                <span style={{color:"#f0c060"}}>{"★".repeat(t.rating)}</span>
                {!t.approved&&<span style={{fontSize:11,background:"rgba(240,192,96,0.15)",color:"#f0c060",padding:"2px 8px",borderRadius:10,fontWeight:600}}>PENDING</span>}
                {t.category==="villa"&&<span style={{fontSize:11,background:"rgba(99,179,237,0.15)",color:"#63b3ed",padding:"2px 8px",borderRadius:10}}>🏡 Villa</span>}
                {t.category==="rental"&&<span style={{fontSize:11,background:"rgba(154,230,180,0.15)",color:"#68d391",padding:"2px 8px",borderRadius:10}}>{t.vehicleType==="scooty"?"🛵":t.vehicleType==="bike"?"🏍️":"🚗"} {t.vehicleName||t.vehicleType||"Rental"}</span>}
              </div>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontStyle:"italic"}}>"{t.text}"</p>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {!t.approved&&<button onClick={()=>approve(t)} disabled={actionId===t._id+"_approve"} style={{background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>{actionId===t._id+"_approve"?"Saving...":"✓ Approve"}</button>}
              {t.approved&&<button onClick={()=>reject(t)} disabled={actionId===t._id+"_reject"} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>{actionId===t._id+"_reject"?"Saving...":"Hide"}</button>}
              <button onClick={()=>startEdit(t)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>Edit</button>
              <button onClick={()=>del(t._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"7px 10px",borderRadius:8,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEW: Inventory Editor ────────────────────────────────────────────────────
const INVENTORY_TYPES = [
  { value:"tour",      label:"🗺️ Tour / Package" },
  { value:"villa",     label:"🏡 Villa" },
  { value:"vehicle",   label:"🛵 Vehicle" },
  { value:"equipment", label:"🔧 Equipment" },
];
const VEHICLE_SUBTYPES = [
  { value:"scooty", label:"🛵 Scooty" },
  { value:"bike",   label:"🏍️ Bike" },
  { value:"car",    label:"🚗 Car" },
];
const STATUS_STYLES = {
  available:   { bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.3)",  color:"#4ade80",  label:"Available" },
  booked:      { bg:"rgba(240,192,96,0.12)",  border:"rgba(240,192,96,0.3)",  color:"#f0c060",  label:"Booked" },
  maintenance: { bg:"rgba(255,100,100,0.12)", border:"rgba(255,100,100,0.3)", color:"#ff6b6b",  label:"Maintenance" },
};

function InventoryEditor({ data, api, reload, showSaved }) {
  const blankItem = { type:"vehicle", vehicleType:"scooty", name:"", description:"", status:"available", pricePerDay:0, capacity:1, location:"", image:"", notes:"" };
  const [items, setItems] = useState(data.inventory||[]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(()=>setItems(data.inventory||[]),[data.inventory]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const startAdd  = () => { setForm({...blankItem}); setEditId(null); setAdding(true); };
  const startEdit = (item) => { setForm({...item}); setEditId(item._id); setAdding(false); };
  const cancel    = () => { setEditId(null); setForm(null); setAdding(false); };

  const save = async () => {
    if (!form.name.trim()) { alert("Please enter a name."); return; }
    if (adding) await api.post("/inventory", form);
    else        await api.put(`/inventory/${editId}`, form);
    cancel(); showSaved(); await reload();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    setItems(l=>l.filter(i=>i._id!==id));
    await api.delete(`/inventory/${id}`);
    await reload();
  };

  const updateStatus = async (item, status) => {
    setItems(l=>l.map(i=>i._id===item._id?{...i,status}:i));
    await api.put(`/inventory/${item._id}`, {...item, status});
    await reload();
  };

  const filtered = filterType==="all" ? items : items.filter(i=>i.type===filterType);

  // Summary counts
  const counts = { all: items.length, tour: 0, villa: 0, vehicle: 0, equipment: 0 };
  items.forEach(i=>{ if(counts[i.type]!==undefined) counts[i.type]++; });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Inventory</h2>
        <button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Item</button>
      </div>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Total Items",  value:counts.all,       color:"#f0c060"},
          {label:"Vehicles",     value:counts.vehicle,   color:"#60a5fa"},
          {label:"Tours",        value:counts.tour,      color:"#a78bfa"},
          {label:"Equipment",    value:counts.equipment, color:"#fb923c"},
        ].map(s=>(
          <div key={s.label} className="adm-stat">
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:"'Playfair Display'"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[["all","All"],["vehicle","🛵 Vehicles"],["tour","🗺️ Tours"],["villa","🏡 Villa"],["equipment","🔧 Equipment"]].map(([val,lbl])=>(
          <button key={val} onClick={()=>setFilterType(val)} style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${filterType===val?"#d4850a":"rgba(255,255,255,0.1)"}`,background:filterType===val?"rgba(212,133,10,0.15)":"transparent",color:filterType===val?"#f0c060":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:500}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {(adding||editId)&&form&&(
        <div className="adm-card" style={{marginBottom:24,border:"1px solid rgba(212,133,10,0.3)"}}>
          <h3 style={{color:"#f0c060",marginBottom:20}}>{adding?"Add Inventory Item":"Edit Item"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label className="adm-label">Type</label>
              <select className="adm-input" value={form.type} onChange={e=>set("type",e.target.value)}>
                {INVENTORY_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.type==="vehicle"&&(
              <div>
                <label className="adm-label">Vehicle type</label>
                <select className="adm-input" value={form.vehicleType} onChange={e=>set("vehicleType",e.target.value)}>
                  {VEHICLE_SUBTYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}
            <div><label className="adm-label">Name *</label><input className="adm-input" value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="e.g. Honda Activa #3"/></div>
            <div>
              <label className="adm-label">Status</label>
              <select className="adm-input" value={form.status} onChange={e=>set("status",e.target.value)}>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div><label className="adm-label">Price per day (₹)</label><input className="adm-input" type="number" value={form.pricePerDay||0} onChange={e=>set("pricePerDay",Number(e.target.value))}/></div>
            <div><label className="adm-label">Capacity (guests/units)</label><input className="adm-input" type="number" value={form.capacity||1} onChange={e=>set("capacity",Number(e.target.value))}/></div>
            <div><label className="adm-label">Location</label><input className="adm-input" value={form.location||""} onChange={e=>set("location",e.target.value)} placeholder="e.g. Goa Garage"/></div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} rows={2}/></div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Notes (internal)</label><textarea className="adm-input" value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Service history, quirks, etc."/></div>
            <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Image" value={form.image} onChange={v=>set("image",v)}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={cancel} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div style={{display:"grid",gap:10}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48}}>No items yet. Add one above!</div>}
        {filtered.map(item=>{
          const ss = STATUS_STYLES[item.status]||STATUS_STYLES.available;
          const typeIcon = item.type==="vehicle"?(item.vehicleType==="scooty"?"🛵":item.vehicleType==="bike"?"🏍️":"🚗"):item.type==="tour"?"🗺️":item.type==="villa"?"🏡":"🔧";
          return (
            <div key={item._id} className="adm-card" style={{display:"flex",gap:14,alignItems:"center"}}>
              {item.image
                ? <img src={item.image} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
                : <div style={{width:60,height:60,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{typeIcon}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:15}}>{item.name}</span>
                  <span style={{fontSize:11,background:"rgba(255,255,255,0.07)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.5)"}}>{typeIcon} {item.type}</span>
                  <span style={{fontSize:11,padding:"2px 9px",borderRadius:10,background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color}}>{ss.label}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",display:"flex",gap:12,flexWrap:"wrap"}}>
                  {item.pricePerDay>0&&<span>₹{item.pricePerDay.toLocaleString()}/day</span>}
                  {item.capacity>0&&<span>{item.capacity} capacity</span>}
                  {item.location&&<span>📍 {item.location}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <select value={item.status} onChange={e=>updateStatus(item,e.target.value)}
                  style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"white",fontSize:12,cursor:"pointer"}}>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button onClick={()=>startEdit(item)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12}}>Edit</button>
                <button onClick={()=>del(item._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"6px 10px",borderRadius:7,cursor:"pointer"}}><Icon name="trash" size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NEW: Accounting Editor ───────────────────────────────────────────────────
const INCOME_CATEGORIES = [
  { value:"villa_rental",     label:"🏡 Villa rental" },
  { value:"tour_booking",     label:"🗺️ Tour booking" },
  { value:"vehicle_rental",   label:"🛵 Vehicle rental" },
  { value:"agency_commission",label:"🤝 Agency commission" },
  { value:"other_income",     label:"➕ Other income" },
];
const EXPENSE_CATEGORIES = [
  { value:"maintenance",  label:"🔧 Maintenance" },
  { value:"utilities",    label:"💡 Utilities" },
  { value:"staff",        label:"👷 Staff / wages" },
  { value:"supplies",     label:"📦 Supplies" },
  { value:"marketing",    label:"📢 Marketing" },
  { value:"other_expense",label:"➖ Other expense" },
];
const PAYMENT_METHODS = ["cash","upi","bank_transfer","card","other"];

function AccountingEditor({ data, api, reload, showSaved }) {
  const accData   = data.accounting || { transactions:[], summary:{ totalIncome:0, totalExpense:0, netProfit:0, breakdown:{} } };
  const summary   = accData.summary || { totalIncome:0, totalExpense:0, netProfit:0, breakdown:{} };
  const allTx     = accData.transactions || [];

  const [tab, setTab]       = useState("ledger");   // ledger | add
  const [txType, setTxType] = useState("income");
  const [filterCat, setFilterCat] = useState("all");
  const [editId, setEditId] = useState(null);

  const blankForm = { type:"income", category:"vehicle_rental", amount:"", date: new Date().toISOString().slice(0,10), description:"", clientName:"", agencyName:"", paymentStatus:"paid", paymentMethod:"cash", notes:"" };
  const [form, setForm] = useState({...blankForm});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const categories = form.type==="income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const startAdd = () => { setForm({...blankForm,type:txType}); setEditId(null); setTab("add"); };
  const startEdit = (tx) => { setForm({...tx, amount:String(tx.amount), date: tx.date?new Date(tx.date).toISOString().slice(0,10):new Date().toISOString().slice(0,10)}); setEditId(tx._id); setTab("add"); };
  const cancel = () => { setEditId(null); setForm({...blankForm}); setTab("ledger"); };

  const save = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount)<=0) { alert("Enter a valid amount."); return; }
    const payload = { ...form, amount: Number(form.amount) };
    if (editId) await api.put(`/accounting/${editId}`, payload);
    else        await api.post("/accounting", payload);
    cancel(); showSaved(); await reload();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await api.delete(`/accounting/${id}`);
    await reload();
  };

  const income   = allTx.filter(t=>t.type==="income");
  const expenses = allTx.filter(t=>t.type==="expense");
  const displayed = filterCat==="all" ? allTx : allTx.filter(t=>t.type===filterCat);

  const categoryLabel = (cat) => {
    const all = [...INCOME_CATEGORIES,...EXPENSE_CATEGORIES];
    return all.find(c=>c.value===cat)?.label || cat;
  };
  const fmt = (n) => `₹${Number(n||0).toLocaleString("en-IN")}`;
  const profitColor = summary.netProfit >= 0 ? "#4ade80" : "#ff6b6b";

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Accounting</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setTxType("income");startAdd();}} style={{background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80",padding:"9px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Income</button>
          <button onClick={()=>{setTxType("expense");setForm(f=>({...blankForm,type:"expense",category:"maintenance"}));setEditId(null);setTab("add");}} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",color:"#ff6b6b",padding:"9px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Expense</button>
        </div>
      </div>

      {/* P&L summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Total income",  value:fmt(summary.totalIncome),  color:"#4ade80"},
          {label:"Total expenses",value:fmt(summary.totalExpense), color:"#ff6b6b"},
          {label:"Net profit",    value:fmt(summary.netProfit),    color:profitColor},
        ].map(s=>(
          <div key={s.label} className="adm-stat">
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"'Playfair Display'"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown by category */}
      {Object.keys(summary.breakdown||{}).length>0&&(
        <div className="adm-card" style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Revenue breakdown</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
            {Object.entries(summary.breakdown).map(([cat,amt])=>(
              <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px"}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{categoryLabel(cat)}</span>
                <span style={{fontSize:13,fontWeight:600,color:"#f0c060"}}>{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {tab==="add"&&(
        <div className="adm-card" style={{marginBottom:24,border:"1px solid rgba(212,133,10,0.3)"}}>
          <h3 style={{color:"#f0c060",marginBottom:20}}>{editId?"Edit Transaction":"New Transaction"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label className="adm-label">Type</label>
              <select className="adm-input" value={form.type} onChange={e=>{set("type",e.target.value);set("category",e.target.value==="income"?"vehicle_rental":"maintenance");}}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="adm-label">Category</label>
              <select className="adm-input" value={form.category} onChange={e=>set("category",e.target.value)}>
                {categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="adm-label">Amount (₹) *</label><input className="adm-input" type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="5000"/></div>
            <div><label className="adm-label">Date</label><input className="adm-input" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
            <div><label className="adm-label">Client name</label><input className="adm-input" value={form.clientName||""} onChange={e=>set("clientName",e.target.value)} placeholder="Priya Sharma"/></div>
            {form.category==="agency_commission"&&(
              <div><label className="adm-label">Agency name</label><input className="adm-input" value={form.agencyName||""} onChange={e=>set("agencyName",e.target.value)} placeholder="Make My Trip"/></div>
            )}
            <div>
              <label className="adm-label">Payment method</label>
              <select className="adm-input" value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}>
                {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-label">Payment status</label>
              <select className="adm-input" value={form.paymentStatus} onChange={e=>set("paymentStatus",e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><input className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="e.g. Honda Activa rental - 3 days"/></div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Notes (internal)</label><textarea className="adm-input" value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={cancel} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Ledger filter */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Filter:</span>
        {[["all","All"],["income","Income"],["expense","Expenses"]].map(([val,lbl])=>(
          <button key={val} onClick={()=>setFilterCat(val)} style={{padding:"6px 14px",borderRadius:16,border:`1px solid ${filterCat===val?"#d4850a":"rgba(255,255,255,0.1)"}`,background:filterCat===val?"rgba(212,133,10,0.15)":"transparent",color:filterCat===val?"#f0c060":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12}}>
            {lbl} ({val==="all"?allTx.length:val==="income"?income.length:expenses.length})
          </button>
        ))}
      </div>

      {/* Transaction ledger */}
      <div style={{display:"grid",gap:8}}>
        {displayed.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48}}>No transactions yet. Add your first entry above!</div>}
        {displayed.map(tx=>{
          const isIncome = tx.type==="income";
          const paidColor = tx.paymentStatus==="paid"?"#4ade80":tx.paymentStatus==="pending"?"#f0c060":"#fb923c";
          return (
            <div key={tx._id} className="adm-card" style={{display:"flex",gap:14,alignItems:"center",borderLeft:`3px solid ${isIncome?"#4ade80":"#ff6b6b"}`,borderRadius:"0 16px 16px 0"}}>
              <div style={{width:44,height:44,borderRadius:10,background:isIncome?"rgba(74,222,128,0.1)":"rgba(255,100,100,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {isIncome?"📥":"📤"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                  <span style={{fontWeight:600,fontSize:14}}>{tx.description||categoryLabel(tx.category)}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>{categoryLabel(tx.category)}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"transparent",border:`1px solid ${paidColor}`,color:paidColor}}>{tx.paymentStatus}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",display:"flex",gap:10,flexWrap:"wrap"}}>
                  {tx.clientName&&<span>👤 {tx.clientName}</span>}
                  {tx.agencyName&&<span>🤝 {tx.agencyName}</span>}
                  {tx.paymentMethod&&<span>{tx.paymentMethod.replace("_"," ")}</span>}
                  <span>{tx.date?new Date(tx.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):""}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:700,color:isIncome?"#4ade80":"#ff6b6b",fontFamily:"'Playfair Display'"}}>{isIncome?"+":"-"}{fmt(tx.amount)}</div>
                <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
                  <button onClick={()=>startEdit(tx)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Edit</button>
                  <button onClick={()=>del(tx._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"4px 8px",borderRadius:6,cursor:"pointer"}}><Icon name="trash" size={12}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
