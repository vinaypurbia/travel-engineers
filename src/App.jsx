import { useState, useEffect } from "react";

const API = "/api";

const DEFAULT_DATA = {
  agency: { name:"IslandDrift", tagline:"Ride Free. Stay Wild. Explore More.", heroSubtitle:"Scooters · Cars · Bikes · Villa", phone:"+91 98765 43210", email:"hello@islanddrift.com", address:"Beach Road, Goa", whatsapp:"919876543210", heroImage:"https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80" },
  rentals: [],
  villa: { name:"IslandDrift Villa", tagline:"Your Private Paradise", description:"A stunning 6-room villa with private pool.", price:"₹18,000", period:"/night", checkIn:"12:00 PM", checkOut:"11:00 AM", minStay:"2 nights", maxGuests:"14 guests", image:"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", amenities:[{icon:"🏊",label:"Private Pool"},{icon:"🛏️",label:"6 Bedrooms"},{icon:"🍳",label:"Full Kitchen"},{icon:"📶",label:"WiFi"},{icon:"❄️",label:"AC"},{icon:"🔒",label:"Security"}], rooms:[{name:"Ocean Suite",beds:"King bed",guests:2,image:""},{name:"Garden Room",beds:"Queen bed",guests:2,image:""},{name:"Poolside Room",beds:"2 Twin beds",guests:2,image:""},{name:"Family Suite",beds:"King + 2 singles",guests:4,image:""},{name:"Sunset Loft",beds:"Queen bed",guests:2,image:""},{name:"Cozy Nook",beds:"Double bed",guests:2,image:""}] },
  testimonials: [{_id:"1",name:"Priya Sharma",location:"Mumbai",text:"The villa was absolutely gorgeous. Pool was clean and staff super helpful!",rating:5},{_id:"2",name:"Rohan Mehta",location:"Bangalore",text:"Rented 3 scooties for our gang. Best decision ever!",rating:5},{_id:"3",name:"Sarah & James",location:"London",text:"4 nights in the villa — complete paradise!",rating:5}]
};

const api = {
  get: (path) => fetch(`${API}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API}${path}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => r.json()),
  put: (path, body) => fetch(`${API}${path}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => r.json()),
  delete: (path) => fetch(`${API}${path}`, { method:"DELETE" }).then(r => r.json()),
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
      const [agency, rentals, villa, testimonials] = await Promise.all([
        api.get("/agency"),
        api.get("/rentals"),
        api.get("/villa"),
        api.get("/testimonials"),
      ]);
      setData({ agency, rentals, villa, testimonials });
    } catch (err) {
      console.error("API failed, using defaults:", err);
      setData(DEFAULT_DATA);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    if (window.location.pathname === "/admin") {
      setView("login");
    }
  }, []);
  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0a1628",color:"#f0c060",fontFamily:"serif",fontSize:24,flexDirection:"column",gap:16}}>
      <div style={{width:48,height:48,border:"3px solid rgba(240,192,96,0.2)",borderTopColor:"#f0c060",borderRadius:"50%",animation:"spin 1s linear infinite"}} />
      Loading IslandDrift...
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
      <div style={{background:"#0a1628",padding:"28px 5%",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:20}}>
        {[["500+","Happy Customers"],[villa.rooms?.length||6,"Villa Rooms"],[rentals.length||15,"Vehicles"],["24/7","Support"]].map(([n,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display'",fontSize:32,fontWeight:900,color:"#f0c060"}}>{n}</div>
            <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>

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
                  <p style={{fontFamily:"'DM Sans'",fontSize:14,color:"#666",lineHeight:1.6,marginBottom:16}}>{rental.description}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                    {(rental.features||[]).map(f=><span key={f} style={{background:"#f5f0e8",padding:"5px 12px",borderRadius:20,fontFamily:"'DM Sans'",fontSize:12,color:"#555"}}>✓ {f}</span>)}
                  </div>
                  <a href={`https://wa.me/${agency.whatsapp}?text=Hi! I want to book ${rental.name} (${rental.price}${rental.period})`} target="_blank" rel="noreferrer">
                    <button className="btn-primary" style={{width:"100%"}}>Book on WhatsApp</button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VILLA */}
      <section id="sec-villa" style={{background:"#0a1628",padding:"100px 5%",color:"white"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:60}}>
            <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#f0c060",textTransform:"uppercase",marginBottom:12}}>Exclusive Stay</div>
            <h2 className="section-title" style={{color:"white"}}>{villa.name}</h2>
            <p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"rgba(255,255,255,0.6)",marginTop:16,fontSize:18}}>{villa.tagline}</p>
          </div>
          <div style={{borderRadius:24,overflow:"hidden",marginBottom:60,position:"relative"}}>
            <img src={villa.image||"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80"} alt="Villa" style={{width:"100%",height:480,objectFit:"cover",display:"block"}} />
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(10,22,40,0.7) 0%,transparent 60%)"}} />
            <div style={{position:"absolute",top:"50%",left:"8%",transform:"translateY(-50%)"}}>
              <div style={{fontFamily:"'Playfair Display'",fontSize:48,fontWeight:900,color:"#f0c060"}}>{villa.price}</div>
              <div style={{fontFamily:"'DM Sans'",fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:12}}>{villa.period} · {villa.minStay} minimum</div>
              <div style={{fontFamily:"'DM Sans'",fontSize:13,color:"rgba(255,255,255,0.6)"}}>👥 {villa.maxGuests}</div>
            </div>
          </div>
          <p style={{fontFamily:"'Lora'",fontSize:18,color:"rgba(255,255,255,0.75)",lineHeight:1.8,textAlign:"center",maxWidth:780,margin:"0 auto 60px"}}>{villa.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:16,marginBottom:60}}>
            {(villa.amenities||[]).map((a,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:"20px 16px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>{a.icon}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:13,color:"rgba(255,255,255,0.8)"}}>{a.label}</div>
              </div>
            ))}
          </div>
          <h3 style={{fontFamily:"'Playfair Display'",fontSize:32,color:"#f0c060",marginBottom:28,textAlign:"center"}}>The Rooms</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:20,marginBottom:48}}>
            {(villa.rooms||[]).map((room,i)=>(
              <div key={i} className="card-hover" style={{borderRadius:16,overflow:"hidden",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <img src={room.image||"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80"} alt={room.name} style={{width:"100%",height:160,objectFit:"cover"}} />
                <div style={{padding:"16px 18px"}}>
                  <div style={{fontFamily:"'Playfair Display'",fontSize:18,color:"white",marginBottom:6}}>{room.name}</div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:13,color:"rgba(255,255,255,0.5)"}}>{room.beds} · Up to {room.guests} guests</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <a href={`https://wa.me/${agency.whatsapp}?text=Hi! I want to book ${villa.name} — ${villa.price}${villa.period}`} target="_blank" rel="noreferrer">
              <button className="btn-primary" style={{fontSize:16,padding:"16px 48px"}}>Book Villa on WhatsApp</button>
            </a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"100px 5%",background:"#faf8f3"}}>
        <div style={{textAlign:"center",marginBottom:60}}>
          <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#d4850a",textTransform:"uppercase",marginBottom:12}}>What Guests Say</div>
          <h2 className="section-title">Reviews</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24,maxWidth:1000,margin:"0 auto"}}>
          {testimonials.map(t=>(
            <div key={t._id} className="card-hover" style={{background:"white",borderRadius:20,padding:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",gap:4,marginBottom:16}}>
                {[...Array(t.rating)].map((_,i)=><span key={i} style={{color:"#f0c060"}}><Icon name="star" size={16} /></span>)}
              </div>
              <p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"#444",lineHeight:1.7,marginBottom:20}}>"{t.text}"</p>
              <div>
                <div style={{fontFamily:"'DM Sans'",fontWeight:600}}>{t.name}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"#999"}}>{t.location}</div>
              </div>
            </div>
          ))}
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

function AdminPanel({ data, api, reload, saved, showSaved, onExit, adminTab, setAdminTab }) {
  const tabs = [{id:"agency",label:"🏢 Agency Info"},{id:"rentals",label:"🛵 Rentals"},{id:"villa",label:"🏡 Villa"},{id:"testimonials",label:"⭐ Reviews"}];
  return (
    <div style={{minHeight:"100vh",background:"#0d1b2e",fontFamily:"'DM Sans',sans-serif",color:"white"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.adm-input{width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-family:'DM Sans';font-size:14px;outline:none;transition:border-color 0.2s;}.adm-input:focus{border-color:#d4850a;}textarea.adm-input{resize:vertical;min-height:80px;line-height:1.6;}label.adm-label{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}.adm-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;}select.adm-input{cursor:pointer;}`}</style>
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
          {adminTab==="agency"&&<AgencyEditor data={data} api={api} showSaved={showSaved}/>}
          {adminTab==="rentals"&&<RentalsEditor data={data} api={api} reload={reload} showSaved={showSaved}/>}
          {adminTab==="villa"&&<VillaEditor data={data} api={api} showSaved={showSaved}/>}
          {adminTab==="testimonials"&&<TestimonialsEditor data={data} api={api} reload={reload} showSaved={showSaved}/>}
        </div>
      </div>
    </div>
  );
}

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
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)}/></div>
            <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Vehicle Image" value={form.image} onChange={v=>set("image",v)}/></div>
          </div>
          <div style={{marginBottom:16}}>
            <label className="adm-label">Features</label>
            {(form.features||[]).map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                <input className="adm-input" value={f} onChange={e=>{const arr=[...form.features];arr[i]=e.target.value;set("features",arr);}}/>
                <button onClick={()=>set("features",form.features.filter((_,j)=>j!==i))} style={{background:"rgba(255,80,80,0.15)",border:"none",color:"#ff6b6b",borderRadius:8,padding:"0 12px",cursor:"pointer"}}>×</button>
              </div>
            ))}
            <button onClick={()=>set("features",[...form.features,""])} style={{background:"transparent",border:"1px dashed rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.4)",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13}}>+ Add Feature</button>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={saveRental} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>{setEditId(null);setForm(null);setAdding(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:14}}>
        {data.rentals.map(r=>(
          <div key={r._id} className="adm-card" style={{display:"flex",gap:16,alignItems:"center"}}>
            <img src={r.image||"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=60"} alt="" style={{width:70,height:56,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:600}}>{r.name}</span>
                <span style={{fontWeight:700,color:"#f0c060"}}>{r.price}</span>
              </div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</p>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
              <button onClick={()=>toggleAvail(r)} style={{fontSize:12,padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",background:r.available?"rgba(74,222,128,0.15)":"rgba(255,80,80,0.15)",color:r.available?"#4ade80":"#ff6b6b",fontWeight:600}}>{r.available?"✓ Live":"✗ Hidden"}</button>
              <button onClick={()=>startEdit(r)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>Edit</button>
              <button onClick={()=>deleteRental(r._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"7px 10px",borderRadius:8,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VillaEditor({ data, api, showSaved }) {
  const [form, setForm] = useState({...data.villa,amenities:[...(data.villa.amenities||[])],rooms:(data.villa.rooms||[]).map(r=>({...r}))});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setAmenity = (i,k,v) => setForm(f=>({...f,amenities:f.amenities.map((a,j)=>j===i?{...a,[k]:v}:a)}));
  const setRoom = (i,k,v) => setForm(f=>({...f,rooms:f.rooms.map((r,j)=>j===i?{...r,[k]:v}:r)}));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put("/villa", form);
      if (res && res._id) { showSaved(); alert("✅ Villa saved!"); }
      else { alert("❌ Failed: " + JSON.stringify(res)); }
    } catch(err) { alert("❌ Error: " + err.message); }
    setSaving(false);
  };
  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,marginBottom:24}}>Villa Settings</h2>
      <div className="adm-card" style={{marginBottom:20}}>
        <h3 style={{color:"#f0c060",marginBottom:18,fontSize:16}}>Basic Info</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[["Villa Name","name"],["Tagline","tagline"],["Price","price"],["Period","period"],["Check-In","checkIn"],["Check-Out","checkOut"],["Min Stay","minStay"],["Max Guests","maxGuests"]].map(([l,k])=>(
            <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
          ))}
          <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} style={{minHeight:100}}/></div>
          <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Villa Main Image" value={form.image} onChange={v=>set("image",v)}/></div>
        </div>
      </div>
      <div className="adm-card" style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:"#f0c060",fontSize:16}}>Amenities</h3>
          <button onClick={()=>setForm(f=>({...f,amenities:[...f.amenities,{icon:"🌟",label:"New"}]}))} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>+ Add</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
          {form.amenities.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:8}}>
              <input className="adm-input" value={a.icon} onChange={e=>setAmenity(i,"icon",e.target.value)} style={{width:52,textAlign:"center",padding:"10px 6px"}}/>
              <input className="adm-input" value={a.label} onChange={e=>setAmenity(i,"label",e.target.value)}/>
              <button onClick={()=>setForm(f=>({...f,amenities:f.amenities.filter((_,j)=>j!==i)}))} style={{background:"rgba(255,80,80,0.1)",border:"none",color:"#ff6b6b",borderRadius:8,padding:"0 10px",cursor:"pointer"}}>×</button>
            </div>
          ))}
        </div>
      </div>
      <div className="adm-card" style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:"#f0c060",fontSize:16}}>Rooms ({form.rooms.length})</h3>
          <button onClick={()=>setForm(f=>({...f,rooms:[...f.rooms,{name:"New Room",beds:"Queen bed",guests:2,image:""}]}))} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>+ Add Room</button>
        </div>
        {form.rooms.map((room,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:14,marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:10,marginBottom:10}}>
              <div><label className="adm-label">Room Name</label><input className="adm-input" value={room.name||""} onChange={e=>setRoom(i,"name",e.target.value)}/></div>
              <div><label className="adm-label">Beds</label><input className="adm-input" value={room.beds||""} onChange={e=>setRoom(i,"beds",e.target.value)}/></div>
              <div><label className="adm-label">Guests</label><input className="adm-input" type="number" value={room.guests||2} onChange={e=>setRoom(i,"guests",e.target.value)}/></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{flex:1}}><ImageUpload label="Room Image" value={room.image} onChange={v=>setRoom(i,"image",v)}/></div>
              <button onClick={()=>setForm(f=>({...f,rooms:f.rooms.filter((_,j)=>j!==i)}))} style={{marginBottom:2,background:"rgba(255,80,80,0.1)",border:"none",color:"#ff6b6b",borderRadius:8,padding:"10px 12px",cursor:"pointer"}}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>{ saving ? "Saving..." : "Save Villa" }</button>
    </div>
  );
}

function TestimonialsEditor({ data, api, reload, showSaved }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const startEdit = (t) => { setForm({...t}); setEditId(t._id); };
  const startAdd = () => { setForm({name:"",location:"",text:"",rating:5}); setEditId("new"); };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => {
    if (editId==="new") await api.post("/testimonials", form);
    else await api.put(`/testimonials/${editId}`, form);
    await reload(); showSaved(); setEditId(null); setForm(null);
  };
  const del = async (id) => { if(window.confirm("Delete review?")){ await api.delete(`/testimonials/${id}`); await reload(); } };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Reviews</h2>
        <button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Review</button>
      </div>
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
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Review Text</label><textarea className="adm-input" value={form.text||""} onChange={e=>set("text",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>{setEditId(null);setForm(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:12}}>
        {data.testimonials.map(t=>(
          <div key={t._id} className="adm-card" style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontWeight:600}}>{t.name}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{t.location}</span>
                <span style={{color:"#f0c060"}}>{"★".repeat(t.rating)}</span>
              </div>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontStyle:"italic"}}>"{t.text}"</p>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>startEdit(t)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>Edit</button>
              <button onClick={()=>del(t._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"7px 10px",borderRadius:8,cursor:"pointer"}}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
