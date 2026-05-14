// v4
import { useState, useEffect, useRef, useCallback } from "react";

const API = "/api";


const api = {
  get: (path) => fetch(`${API}${path}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
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

// ─── Mobile-Responsive Navbar ─────────────────────────────────────────────────
function MobileNav({ agency, activeNav, setActiveNav }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollTo = (id) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({behavior:"smooth"});
    setActiveNav(id);
    setMenuOpen(false);
  };
  return (
    <>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"0 5%",height:70,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,22,40,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(212,133,10,0.2)"}}>
        <div style={{cursor:"pointer",display:"flex",alignItems:"center"}} onClick={()=>scrollTo("home")}>
          {/* Show full LogoAnimation canvas — it renders the compass + TRAVEL ENGINEERS text */}
          <LogoAnimation size={58} />
        </div>
        <div className="nav-desktop" style={{display:"flex",gap:28,alignItems:"center"}}>
          {["home","rentals","villa","tours","contact"].map(n=>(
            <span key={n} className="nav-link" style={{color:activeNav===n?"#f0c060":"rgba(255,255,255,0.7)"}}
              onClick={()=>scrollTo(n)}>{n}</span>
          ))}
        </div>
        <button onClick={()=>setMenuOpen(o=>!o)} className="hamburger"
          style={{background:"transparent",border:"none",color:"#f0c060",fontSize:24,cursor:"pointer",padding:"4px 8px",display:"none"}}>
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
        <style>{".hamburger{display:none!important;} @media(max-width:640px){.hamburger{display:block!important;} .nav-desktop{display:none!important;}}"}</style>
      </nav>
      {menuOpen&&(
        <div style={{position:"fixed",top:70,left:0,right:0,zIndex:99,background:"rgba(10,22,40,0.98)",borderBottom:"1px solid rgba(212,133,10,0.2)",padding:"12px 0",display:"flex",flexDirection:"column"}}>
          {["home","rentals","villa","contact"].map(n=>(
            <button key={n} onClick={()=>scrollTo(n)}
              style={{background:"transparent",border:"none",color:activeNav===n?"#f0c060":"rgba(255,255,255,0.7)",padding:"14px 5%",textAlign:"left",fontFamily:"'DM Sans'",fontSize:15,fontWeight:500,textTransform:"uppercase",letterSpacing:2,cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              {n}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Logo Animation Component ─────────────────────────────────────────────────
function LogoAnimation({ size = 200 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = size;
    const cx = S / 2, cy = S * 0.44;
    const scale = S / 400;
    const GOLD = '#d4850a', MUTED = '#c8b898', DARK = '#0a1628', WHITE = '#ffffff';

    const easeOut = (t, p=3) => 1 - Math.pow(1-t, p);
    const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

    const T = {
      spinEnd:2.2, titleWoosh:0.4, titleEnd:1.4,
      settleStart:2.0, settleEnd:3.2,
      taglineStart:3.0, taglineEnd:4.6, total:5.0
    };

    function drawCompass(angle, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      [118,105].forEach(r => {
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
        ctx.strokeStyle = GOLD; ctx.lineWidth = 0.6;
        ctx.globalAlpha = alpha * 0.18; ctx.stroke();
      });
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(0,0,92,0,Math.PI*2);
      ctx.fillStyle = WHITE; ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 0.6;
      ctx.globalAlpha = alpha * 0.3; ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.rotate(angle);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
      [[0,-92,0,-80],[0,92,0,80],[-92,0,-80,0],[92,0,80,0]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
      ctx.lineWidth = 1; ctx.globalAlpha = alpha * 0.4;
      [[65,-65,57,-57],[65,65,57,57],[-65,-65,-57,-57],[-65,65,-57,57]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['N',0,-78,GOLD],['S',0,78,'#8a7868'],['W',-78,0,'#8a7868'],['E',78,0,'#8a7868']].forEach(([l,x,y,col]) => {
        ctx.fillStyle = col; ctx.fillText(l,x,y);
      });
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.moveTo(0,-66); ctx.lineTo(6,0); ctx.lineTo(0,-14); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = MUTED;
      ctx.beginPath(); ctx.moveTo(0,66); ctx.lineTo(6,0); ctx.lineTo(0,14); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fillStyle = DARK; ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,3.5,0,Math.PI*2); ctx.fillStyle = GOLD; ctx.fill();
      ctx.restore();
    }

    function drawTitle(progress) {
      if (progress <= 0) return;
      const p = clamp(progress, 0, 1);
      ctx.save();
      const fs = Math.max(11, Math.round(32 * scale));
      ctx.font = `bold ${fs}px Georgia, serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const slideX = (1 - easeOut(p, 4)) * 200 * scale;
      const alpha = easeOut(p, 2);
      const ty = cy + 128 * scale, ey = cy + 163 * scale;
      if (slideX > 2) {
        ctx.globalAlpha = alpha * 0.15;
        ctx.fillStyle = WHITE; ctx.fillText('TRAVEL', cx + slideX*1.6 + 40*scale, ty);
        ctx.fillStyle = GOLD;  ctx.fillText('ENGINEERS', cx + slideX*1.3 + 30*scale, ey);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = WHITE; ctx.fillText('TRAVEL', cx + slideX, ty);
      ctx.fillStyle = GOLD;  ctx.fillText('ENGINEERS', cx + slideX, ey);
      if (p > 0.6) {
        const dp = easeOut((p-0.6)/0.4);
        const divW = 70 * dp * scale;
        const dy = cy + 147 * scale;
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx-20*scale-divW, dy); ctx.lineTo(cx-24*scale, dy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+24*scale, dy); ctx.lineTo(cx+20*scale+divW, dy); ctx.stroke();
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.moveTo(cx, dy-4*scale); ctx.lineTo(cx+4*scale,dy); ctx.lineTo(cx,dy+4*scale); ctx.lineTo(cx-4*scale,dy);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function drawTagline(progress) {
      if (progress <= 0) return;
      const chars = 'WE KNOW THE WAY'.split('');
      ctx.save();
      const fs = Math.max(11, Math.round(12 * scale));
      ctx.font = `400 ${fs}px Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const charW = 11 * scale;
      const startX = cx - (chars.length * charW)/2 + charW/2;
      const baseY = cy + 200 * scale;
      chars.forEach((ch, i) => {
        const delay = i / chars.length * 0.7;
        const p = clamp((progress - delay) / 0.35, 0, 1);
        const ep = easeOut(p, 2);
        ctx.globalAlpha = ep;
        ctx.fillStyle = '#8a7868';
        ctx.fillText(ch, startX + i * charW, baseY + (1-ep) * 18 * scale);
      });
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, S, S * 1.1);
      const sec = tRef.current / 60;
      let needleAngle = 0;
      if (sec < T.spinEnd) {
        const sp = sec / T.spinEnd;
        const speed = Math.pow(1 - easeOut(sp,2), 2) * 25 + 0.02;
        needleAngle = -tRef.current * speed * 0.3;
      }
      if (sec > T.settleStart) {
        const settle = clamp((sec - T.settleStart)/(T.settleEnd - T.settleStart), 0, 1);
        needleAngle = Math.sin(easeOut(settle)*Math.PI*3) * (1 - easeOut(settle,2)) * 0.25;
      }
      drawCompass(needleAngle, clamp(sec/0.3, 0, 1));
      drawTitle(clamp((sec - T.titleWoosh)/(T.titleEnd - T.titleWoosh), 0, 1));
      drawTagline(clamp((sec - T.taglineStart)/(T.taglineEnd - T.taglineStart), 0, 1));
      tRef.current++;
      if (sec < T.total + 1.5) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        tRef.current = 0;
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={Math.round(size * 1.1)}
      style={{display:"block",background:"transparent"}}
    />
  );
}

// ─── Travel Engineers Preloader ───────────────────────────────────────────────
function TravelPreloader() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#060c18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=Montserrat:wght@200;400&display=swap');
        @keyframes te-rot1{to{transform:rotate(360deg)}}
        @keyframes te-rot2{to{transform:rotate(-360deg)}}
        @keyframes te-logoPop{from{opacity:0;transform:scale(0.4)}to{opacity:1;transform:scale(1)}}
        @keyframes te-circlePulse{0%,100%{box-shadow:0 0 20px rgba(245,183,49,0.15)}50%{box-shadow:0 0 50px rgba(245,183,49,0.4)}}
        @keyframes te-slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes te-barFill{0%{width:0%}40%{width:55%}70%{width:80%}100%{width:100%}}
        @keyframes te-pFloat{0%{opacity:0;transform:translateY(0) scale(0.5)}15%{opacity:0.7}100%{opacity:0;transform:translateY(-120px) scale(0)}}
        @keyframes te-blobIn{to{opacity:1}}
        @keyframes te-orbit{from{transform:rotate(0deg) translateX(90px)}to{transform:rotate(360deg) translateX(90px)}}
        .te-ring1{animation:te-rot1 6s linear infinite;transform-origin:100px 100px;}
        .te-ring2{animation:te-rot2 9s linear infinite;transform-origin:100px 100px;}
        .te-ring3{animation:te-rot1 4s linear infinite;transform-origin:100px 100px;}
      `}</style>

      {/* Aurora blobs */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,183,49,0.1),transparent 70%)",top:-100,left:-100,opacity:0,animation:"te-blobIn 1.2s ease 0.2s forwards",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,100,50,0.07),transparent 70%)",bottom:-80,right:-80,opacity:0,animation:"te-blobIn 1.2s ease 0.5s forwards",filter:"blur(80px)"}}/>
      </div>

      {/* Particles */}
      {[...Array(16)].map((_,i)=>(
        <div key={i} style={{position:"absolute",width:2,height:2,borderRadius:"50%",background:"rgba(245,183,49,0.6)",left:`${6+i*5.8}%`,bottom:`${10+(i%5)*10}%`,opacity:0,animation:`te-pFloat ${1.5+(i%6)*0.35}s ease-in ${(i%8)*0.25}s infinite`}}/>
      ))}

      {/* Globe */}
      <div style={{position:"relative",width:200,height:200,marginBottom:36}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 200 200" fill="none">
          <g className="te-ring1">
            <circle cx="100" cy="100" r="92" stroke="rgba(245,183,49,0.18)" strokeWidth="1" strokeDasharray="5 5"/>
            <circle cx="100" cy="100" r="92" stroke="rgba(245,183,49,0.55)" strokeWidth="1.5" strokeDasharray="40 144" strokeLinecap="round"/>
          </g>
          <g className="te-ring2">
            <circle cx="100" cy="100" r="74" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3 7"/>
            <circle cx="100" cy="100" r="74" stroke="rgba(255,140,66,0.45)" strokeWidth="1.5" strokeDasharray="25 115" strokeLinecap="round"/>
          </g>
          <g className="te-ring3">
            <circle cx="100" cy="100" r="56" stroke="rgba(245,183,49,0.12)" strokeWidth="1" strokeDasharray="2 8"/>
            <circle cx="100" cy="100" r="56" stroke="rgba(245,183,49,0.3)" strokeWidth="1" strokeDasharray="15 90" strokeLinecap="round"/>
          </g>
          <ellipse cx="100" cy="100" rx="92" ry="28" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        </svg>

        {/* Orbiting dot */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:0,height:0,animation:"te-orbit 3s linear infinite",transformOrigin:"0 0"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#f5b731",boxShadow:"0 0 10px 3px rgba(245,183,49,0.7)",marginTop:-4,marginLeft:-4}}/>
        </div>

        {/* Center logo */}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",animation:"te-logoPop 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both",opacity:0}}>
          <div style={{width:90,height:90,borderRadius:"50%",background:"linear-gradient(145deg,#0f1a2e,#1a2d4a)",border:"1.5px solid rgba(245,183,49,0.35)",display:"flex",alignItems:"center",justifyContent:"center",animation:"te-circlePulse 2.5s ease-in-out infinite"}}>
            <LogoAnimation size={70} />
          </div>
        </div>
      </div>

      {/* Brand text */}
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:600,color:"#fff",letterSpacing:"0.08em",animation:"te-slideUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.5s both",opacity:0}}>
          Travel <span style={{color:"#f5b731"}}>Engineers</span>
        </div>
        <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:400,color:"rgba(255,255,255,0.35)",letterSpacing:"0.5em",textTransform:"uppercase",marginTop:8,animation:"te-slideUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.7s both",opacity:0}}>
          We Know The Way
        </div>
      </div>

      {/* Progress bar */}
      <div style={{marginTop:40,animation:"te-slideUp 0.5s ease 0.9s both",opacity:0}}>
        <div style={{width:160,height:1,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",position:"relative"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#f5b731,#ff8c42)",borderRadius:99,animation:"te-barFill 2s cubic-bezier(0.4,0,0.2,1) 1s both",width:0}}/>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPayPage = window.location.pathname === "/pay" || window.location.hash === "#/pay";
  const [view, setView] = useState(isPayPage ? "pay" : "home");
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeNav, setActiveNav] = useState("home");
  const [filterType, setFilterType] = useState("all");
  const [adminTab, setAdminTab] = useState("dashboard");
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: "success"|"error"|"delete" }
  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };
  const [bookingVehicle, setBookingVehicle] = useState(null); // vehicle being booked

  const safeGet = async (path, fallback) => {
    try {
      const result = await api.get(path);
      if (result === null || result === undefined) return fallback;
      if (Array.isArray(fallback) && !Array.isArray(result)) return fallback;
      if (!Array.isArray(fallback) && typeof fallback === "object" && Array.isArray(result)) return fallback;
      if (result && result.error) return fallback;
      return result;
    } catch { return fallback; }
  };

  const loadAllData = async () => {
    try {
      const [agency, rentals, villa, testimonials, inventory, accounting, bookings, tours, tourBookings] = await Promise.all([
        safeGet("/agency", {name:"",tagline:"",heroSubtitle:"",phone:"",email:"",address:"",whatsapp:"",heroImage:""}),
        safeGet("/rentals", []),
        safeGet("/villa", {name:"",tagline:"",description:"",price:"",period:"/night",checkIn:"",checkOut:"",minStay:"",maxGuests:"",image:"",amenities:[],rooms:[]}),
        safeGet("/testimonials", []),
        safeGet("/inventory", []),
        safeGet("/accounting", {transactions:[],summary:{}}),
        safeGet("/bookings", []),
        safeGet("/tours", []),
        safeGet("/tours?bookings=1", []),
      ]);
      setData({ agency, rentals, villa, testimonials, inventory, accounting, bookings, tours, tourBookings });
    } catch (err) {
      console.error("API failed:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    if (window.location.pathname === "/admin") {
      setView("login");
    }
  }, []);

  const showSaved = (msg="✅ Changes saved!", type="success") => { setSaved(true); setTimeout(() => setSaved(false), 2000); showToast(msg, type); };

  // ── 10-minute idle session timeout for admin ──
  const idleTimer = useRef(null);
  const resetIdleTimer = useCallback(() => {
    if (view !== "admin") return;
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setView("login");
      showToast("⏱️ Session expired due to inactivity. Please log in again.", "error");
    }, 10 * 60 * 1000); // 10 minutes
  }, [view]);

  useEffect(() => {
    if (view !== "admin") { clearTimeout(idleTimer.current); return; }
    const events = ["mousemove","keydown","touchstart","click","scroll"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer(); // start timer immediately on admin entry
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      clearTimeout(idleTimer.current);
    };
  }, [view, resetIdleTimer]);

  if (loading) return <TravelPreloader />;

  if (view === "login") return <LoginScreen loginInput={loginInput} setLoginInput={setLoginInput} loginError={loginError} agency={data.agency||{}}
    onLogin={async () => {
      try {
        const res = await api.post("/auth", { password: loginInput });
        if (res.success) { setView("admin"); setLoginError(""); setLoginInput(""); }
        else setLoginError("Wrong password!");
      } catch { setLoginError("Error connecting. Try again."); }
    }} onBack={() => setView("home")} />;

  if (view === "pay") return <PayPage />;
  if (view === "admin") return (
    <>
      <AdminPanel data={data} api={api} reload={loadAllData} saved={saved} showSaved={showSaved} onExit={() => { setView("home"); loadAllData(); }} adminTab={adminTab} setAdminTab={setAdminTab} />
    </>
  );

  const { agency, rentals, villa, testimonials } = data;
  const filtered = filterType === "all" ? rentals : rentals.filter(r => r.type === filterType);

  return (
    <div style={{fontFamily:"'Lora',Georgia,serif",background:"#faf8f3",color:"#1a1a2e",minHeight:"100vh",overflowX:"hidden",maxWidth:"100vw"}}>
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
        @media(max-width:768px){
          .nav-link{display:none;}
          nav{padding:0 4% !important;}
          .section-title{font-size:28px !important;}
          .btn-primary,.btn-outline{padding:12px 20px !important;font-size:13px !important;}
        }
      `}</style>

      {/* NAVBAR */}
      <MobileNav agency={agency} activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* HERO */}
      <section id="sec-home" style={{height:"100vh",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {/* Hero image */}
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${agency.heroImage})`,backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.4)"}} />
        {/* Dark gradient overlay */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(10,22,40,0.9))"}} />

        {/* Foreground text — unchanged from original */}
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
                  <button className="btn-primary" style={{width:"100%",padding:"12px",fontSize:14}} onClick={()=>setBookingVehicle(rental)}>
                    Book Now →
                  </button>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:32,marginBottom:48}}>
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
          {villa.googleMapUrl&&(
            <div style={{textAlign:"center",marginBottom:32}}>
              <a href={villa.googleMapUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:12,padding:"12px 24px",color:"#f0c060",textDecoration:"none",fontFamily:"'DM Sans'",fontSize:14,fontWeight:600}}>
                <span style={{fontSize:20}}>📍</span> View Location on Google Maps
              </a>
            </div>
          )}
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display'",fontSize:36,fontWeight:900,color:"#f0c060",marginBottom:8}}>{villa.price}<span style={{fontSize:16,color:"rgba(255,255,255,0.4)",fontFamily:"'DM Sans'"}}>{villa.period}</span></div>
            <a href={`https://wa.me/${agency.whatsapp}?text=Hi! I'd like to book the ${villa.name}`} target="_blank" rel="noreferrer">
              <button className="btn-primary" style={{fontSize:16,padding:"16px 48px",marginTop:16}}>Book Villa → WhatsApp</button>
            </a>
          </div>
        </div>
      </section>

      {/* TOURS & TAXI */}
      <section id="sec-tours" style={{padding:"100px 5%",background:"#f8f4ed"}}>
        <div style={{textAlign:"center",marginBottom:60}}>
          <div style={{fontFamily:"'DM Sans'",fontSize:12,letterSpacing:4,color:"#d4850a",textTransform:"uppercase",marginBottom:12}}>Explore More</div>
          <h2 className="section-title">Tours & Transfers</h2>
          <p style={{fontFamily:"'Lora'",fontStyle:"italic",color:"#666",marginTop:16,fontSize:18}}>Day trips, multi-day adventures, taxi rides & airport pickups</p>
        </div>
        {(data.tours||[]).filter(t=>t.available).length > 0 && (
          <TourSection tours={(data.tours||[]).filter(t=>t.available)} agency={agency} api={api} />
        )}
        {(data.tours||[]).filter(t=>t.available).length === 0 && (
          <div style={{textAlign:"center",color:"#999",fontFamily:"'DM Sans'",padding:60}}>
            <div style={{fontSize:48,marginBottom:16}}>Tours coming soon!</div>
          </div>
        )}
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
            {[{icon:"📞",label:"Call / WhatsApp",value:agency.phone,href:`tel:${agency.phone}`},{icon:"✉️",label:"Email",value:agency.email,href:`mailto:${agency.email}`},{icon:"📍",label:"Location",value:agency.address,href:agency.googleMapUrl||"#",target:"_blank"}].map(c=>(
              <a key={c.label} href={c.href} target={c.target||"_self"} rel="noreferrer" style={{textDecoration:"none",display:"block",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:"28px 20px"}}>
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

      {/* ── Booking Modal ── */}
      {bookingVehicle && (
        <BookingModal
          vehicle={bookingVehicle}
          whatsapp={agency.whatsapp}
          api={api}
          onClose={()=>setBookingVehicle(null)}
        />
      )}

      {/* ── Global Toast Notification ── */}
      {toast&&(
        <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.type==="delete"?"#ef4444":toast.type==="error"?"#ef4444":"#16a34a",color:"white",padding:"13px 28px",borderRadius:12,fontFamily:"'DM Sans'",fontSize:15,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap"}}>
          {toast.type==="delete"?"🗑️":toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}
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


// ─── BookingPaySummary (extracted from IIFE to fix babel/eslint compat) ───────
function BookingPaySummary({ b, getPricePerDay }) {
  const bDays = (b.checkIn&&b.checkOut)?Math.max(1,Math.round((new Date(b.checkOut)-new Date(b.checkIn))/864e5)):1;
  const bPPD = getPricePerDay(b);
  const bTotal = bPPD>0 ? bPPD*bDays : (b.tokenAmount>0 ? b.tokenAmount*2 : 0);
  const received = b.receivedAmount||0;
  const remaining = bTotal>0 ? Math.max(0, bTotal - received) : Math.max(0, (b.tokenAmount*2||0) - received);
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
      {bTotal>0&&<div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Order Total</div><div style={{fontSize:16,fontWeight:700,color:"#60a5fa"}}>₹{bTotal.toLocaleString("en-IN")}</div></div>}
      {b.tokenAmount>0&&<div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Requested</div><div style={{fontSize:16,fontWeight:700,color:"#fb923c"}}>₹{b.tokenAmount.toLocaleString("en-IN")}</div></div>}
      {b.receivedAmount>0&&<div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Received</div><div style={{fontSize:16,fontWeight:700,color:"#4ade80"}}>₹{b.receivedAmount.toLocaleString("en-IN")}</div></div>}
      <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Remaining</div><div style={{fontSize:16,fontWeight:700,color:remaining>0?"#f0c060":"#4ade80"}}>₹{remaining.toLocaleString("en-IN")}</div></div>
    </div>
  );
}

// ─── Public Tour Section ──────────────────────────────────────────────────────────────────────────────
function TourSection({ tours, agency, api }) {
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState(null);
  const [booking, setBooking]   = useState(null);
  const TYPE_LABELS = {"all":"All","day-trip":"Day Trips","multi-day":"Multi-Day","taxi":"Taxi Rides","airport":"Airport Pickup"};
  const types = ["all", ...["day-trip","multi-day","taxi","airport"].filter(t=>tours.some(r=>r.type===t))];
  const visible = filter==="all" ? tours : tours.filter(t=>t.type===filter);
  return (
    <div>
      <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:44,flexWrap:"wrap"}}>
        {types.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{padding:"10px 22px",borderRadius:30,border:"2px solid",fontFamily:"'DM Sans'",fontWeight:600,fontSize:13,cursor:"pointer",transition:"all 0.2s",borderColor:filter===t?"#d4850a":"#ddd",background:filter===t?"#d4850a":"transparent",color:filter===t?"white":"#555"}}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:28}}>
        {visible.map(tour=>(
          <div key={tour._id} className="card-hover" style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.08)",cursor:"pointer"}} onClick={()=>setSelected(tour)}>
            <div style={{height:210,backgroundImage:`url(${tour.image||"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80"})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.55),transparent)"}}/>
              <div style={{position:"absolute",top:14,left:14}}>
                <span style={{background:"rgba(0,0,0,0.55)",color:"white",fontSize:11,padding:"4px 10px",borderRadius:20,fontFamily:"'DM Sans'",fontWeight:600}}>{TYPE_LABELS[tour.type]}</span>
                {tour.tag&&<span style={{marginLeft:6,background:"#d4850a",color:"white",fontSize:11,padding:"4px 10px",borderRadius:20,fontFamily:"'DM Sans'",fontWeight:700}}>{tour.tag}</span>}
              </div>
              {tour.duration&&<div style={{position:"absolute",bottom:14,right:14,background:"rgba(0,0,0,0.6)",color:"white",fontSize:12,padding:"4px 10px",borderRadius:12,fontFamily:"'DM Sans'"}}>{tour.duration}</div>}
            </div>
            <div style={{padding:"22px 24px 24px"}}>
              <h3 style={{fontFamily:"'Playfair Display'",fontSize:21,fontWeight:700,marginBottom:8}}>{tour.title}</h3>
              {tour.destinations&&tour.destinations.length>0&&<div style={{fontSize:12,color:"#d4850a",fontFamily:"'DM Sans'",marginBottom:10,fontWeight:600}}>Destinations: {tour.destinations.join(" / ")}</div>}
              {tour.description&&<p style={{fontFamily:"'Lora'",fontSize:14,color:"#666",marginBottom:16,lineHeight:1.6,fontStyle:"italic"}}>{tour.description.slice(0,100)}{tour.description.length>100?"...":""}</p>}
              {tour.inclusions&&tour.inclusions.length>0&&(
                <div style={{marginBottom:12}}>
                  {tour.inclusions.slice(0,3).map((inc,i)=>(
                    <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                      <span style={{color:"#16a34a",fontWeight:700,fontSize:13,flexShrink:0}}>✓</span>
                      <span style={{fontSize:12,color:"#555",fontFamily:"'DM Sans'",lineHeight:1.5}}>{inc}</span>
                    </div>
                  ))}
                  {tour.inclusions.length>3&&<div style={{fontSize:11,color:"#d4850a",fontFamily:"'DM Sans'",fontWeight:600,marginTop:2}}>+{tour.inclusions.length-3} more — see details</div>}
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,gap:8,flexWrap:"wrap"}}>
                <div>
                  <span style={{fontFamily:"'Playfair Display'",fontSize:22,fontWeight:700,color:"#d4850a"}}>₹{(tour.basePrice||0).toLocaleString("en-IN")}</span>
                  <span style={{fontFamily:"'DM Sans'",fontSize:12,color:"#999",marginLeft:4}}>{tour.priceLabel||"per package"}</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={e=>{e.stopPropagation();setSelected(tour);}} style={{padding:"9px 16px",fontSize:12,fontFamily:"'DM Sans'",fontWeight:600,border:"2px solid #d4850a",borderRadius:20,background:"transparent",color:"#d4850a",cursor:"pointer"}}>See Details</button>
                  <button className="btn-primary" style={{padding:"9px 16px",fontSize:12}} onClick={e=>{e.stopPropagation();setBooking(tour);}}>Book Now</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected&&<TourDetailModal tour={selected} onBook={()=>{setBooking(selected);setSelected(null);}} onClose={()=>setSelected(null)} />}
      {booking&&<TourBookingModal tour={booking} agency={agency} api={api} onClose={()=>setBooking(null)} />}
    </div>
  );
}

function TourDetailModal({ tour, onBook, onClose }) {
  const TYPE_LABELS = {"day-trip":"Day Trip","multi-day":"Multi-Day","taxi":"Taxi","airport":"Airport Pickup"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"white",borderRadius:20,maxWidth:680,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {tour.image&&<div style={{height:260,backgroundImage:`url(${tour.image})`,backgroundSize:"cover",backgroundPosition:"center",borderRadius:"20px 20px 0 0",position:"relative"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5),transparent)",borderRadius:"20px 20px 0 0"}}/>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.5)",border:"none",color:"white",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:18}}>x</button>
        </div>}
        <div style={{padding:"28px 32px"}}>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{background:"#fff3e0",color:"#d4850a",fontSize:12,padding:"4px 12px",borderRadius:20,fontWeight:600}}>{TYPE_LABELS[tour.type]}</span>
            {tour.tag&&<span style={{background:"#d4850a",color:"white",fontSize:12,padding:"4px 12px",borderRadius:20,fontWeight:600}}>{tour.tag}</span>}
            {tour.duration&&<span style={{background:"#f5f5f5",color:"#555",fontSize:12,padding:"4px 12px",borderRadius:20}}>{tour.duration}</span>}
          </div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,fontWeight:700,color:"#1a1a2e",marginBottom:8}}>{tour.title}</h2>
          {tour.destinations&&tour.destinations.length>0&&<div style={{color:"#d4850a",fontFamily:"'DM Sans'",fontWeight:600,marginBottom:16}}>{tour.destinations.join(" / ")}</div>}
          {tour.description&&<p style={{fontFamily:"'Lora'",fontSize:15,color:"#555",lineHeight:1.8,marginBottom:24,fontStyle:"italic"}}>{tour.description}</p>}
          {tour.highlights&&tour.highlights.length>0&&<div style={{marginBottom:28}}>
            <h4 style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#1a1a2e",marginBottom:16,textTransform:"uppercase",fontSize:12,letterSpacing:2,borderBottom:"2px solid #f0e8d8",paddingBottom:8}}>Tour Itinerary & Highlights</h4>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {tour.highlights.map((h,i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{minWidth:28,height:28,borderRadius:"50%",background:"#d4850a",color:"white",fontFamily:"'DM Sans'",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:14,color:"#333",lineHeight:1.7,paddingTop:4}}>{h}</div>
                </div>
              ))}
            </div>
          </div>}
          {(tour.inclusions&&tour.inclusions.length>0)||(tour.exclusions&&tour.exclusions.length>0)?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
            {tour.inclusions&&tour.inclusions.length>0&&<div>
              <h4 style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#1a1a2e",marginBottom:10,textTransform:"uppercase",fontSize:12,letterSpacing:2}}>What's Included</h4>
              {tour.inclusions.map((inc,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,color:"#444",fontFamily:"'DM Sans'"}}><span style={{color:"#16a34a",fontWeight:700}}>✓</span>{inc}</div>)}
            </div>}
            {tour.exclusions&&tour.exclusions.length>0&&<div>
              <h4 style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#1a1a2e",marginBottom:10,textTransform:"uppercase",fontSize:12,letterSpacing:2}}>Not Included</h4>
              {tour.exclusions.map((exc,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,color:"#444",fontFamily:"'DM Sans'"}}><span style={{color:"#ef4444",fontWeight:700}}>✕</span>{exc}</div>)}
            </div>}
          </div>:null}
          {tour.itinerary&&tour.itinerary.length>0&&<div style={{marginBottom:24}}>
            <h4 style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#1a1a2e",marginBottom:12,textTransform:"uppercase",fontSize:12,letterSpacing:2}}>Itinerary</h4>
            {tour.itinerary.map((day,i)=>(
              <div key={i} style={{borderLeft:"3px solid #d4850a",paddingLeft:16,marginBottom:16}}>
                <div style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#d4850a",marginBottom:4}}>Day {day.day}: {day.title}</div>
                <div style={{fontFamily:"'Lora'",fontSize:14,color:"#666",lineHeight:1.6}}>{day.description}</div>
                {day.meals&&<div style={{fontSize:12,color:"#888",marginTop:4}}>Meals: {day.meals}</div>}
                {day.accommodation&&<div style={{fontSize:12,color:"#888",marginTop:2}}>Stay: {day.accommodation}</div>}
              </div>
            ))}
          </div>}
          {/* Package Details Table */}
          <div style={{background:"#faf8f3",borderRadius:12,padding:"16px 20px",marginBottom:20,border:"1px solid #f0e8d8"}}>
            <h4 style={{fontFamily:"'DM Sans'",fontWeight:700,color:"#1a1a2e",marginBottom:12,textTransform:"uppercase",fontSize:12,letterSpacing:2}}>Package Details</h4>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans'",fontSize:13}}>
              <tbody>
                {tour.duration&&<tr><td style={{padding:"5px 0",color:"#888",width:"40%"}}>Duration</td><td style={{padding:"5px 0",fontWeight:600,color:"#333"}}>{tour.duration}</td></tr>}
                {tour.maxPax&&<tr><td style={{padding:"5px 0",color:"#888"}}>Max Capacity</td><td style={{padding:"5px 0",fontWeight:600,color:"#333"}}>{tour.maxPax} Pax</td></tr>}
                {tour.destinations&&tour.destinations.length>0&&<tr><td style={{padding:"5px 0",color:"#888"}}>Route</td><td style={{padding:"5px 0",fontWeight:600,color:"#333"}}>{tour.destinations.join(" → ")}</td></tr>}
                {tour.pickupPoints&&tour.pickupPoints.length>0&&<tr><td style={{padding:"5px 0",color:"#888"}}>Pickup Points</td><td style={{padding:"5px 0",color:"#333"}}>{tour.pickupPoints.join(", ")}</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,borderTop:"1px solid #eee"}}>
            <div>
              <span style={{fontFamily:"'Playfair Display'",fontSize:28,fontWeight:700,color:"#d4850a"}}>₹{(tour.basePrice||0).toLocaleString("en-IN")}</span>
              <span style={{fontFamily:"'DM Sans'",fontSize:13,color:"#999",marginLeft:6}}>{tour.priceLabel||"per package"}</span>
            </div>
            <button className="btn-primary" style={{padding:"14px 32px",fontSize:15}} onClick={onBook}>Book This Tour</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourBookingModal({ tour, agency, api, onClose }) {
  const isAirport = tour.type==="airport";
  const [form, setForm] = useState({customerName:"",phone:"",email:"",travelDate:"",pax:"1",pickupPoint:"",flightNumber:"",notes:""});
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = {width:"100%",padding:"12px 14px",border:"1.5px solid #e8e8e8",borderRadius:10,fontFamily:"'DM Sans'",fontSize:14,outline:"none",color:"#1a1a2e",background:"white",boxSizing:"border-box"};
  const lbl = {display:"block",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,color:"#999",textTransform:"uppercase",letterSpacing:2,marginBottom:6};
  const submit = async () => {
    if (!form.customerName.trim()||!form.phone.trim()) { alert("Please fill name and phone."); return; }
    if (!form.travelDate) { alert("Please select a travel date."); return; }
    setStatus("sending");
    try {
      const res = await api.post("/tours?bookings=1", { tourId:tour._id, tourTitle:tour.title, tourType:tour.type, ...form, basePrice:tour.basePrice||0 });
      if (res.success) { setResult(res); setStatus("done"); if (res.whatsappUrl) window.open(res.whatsappUrl,"_blank"); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:20,maxWidth:540,width:"100%",maxHeight:"90vh",overflowY:"auto",padding:"32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <h3 style={{fontFamily:"'Playfair Display'",fontSize:24,color:"#1a1a2e",marginBottom:4}}>Book Tour</h3>
            <div style={{fontFamily:"'DM Sans'",color:"#d4850a",fontWeight:600}}>{tour.title}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",fontSize:22,cursor:"pointer",color:"#999"}}>x</button>
        </div>
        {status==="done" ? (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:52,marginBottom:16}}>Done!</div>
            <h4 style={{fontFamily:"'Playfair Display'",fontSize:22,color:"#1a1a2e",marginBottom:8}}>Booking Received!</h4>
            <p style={{fontFamily:"'Lora'",color:"#666",fontSize:15,lineHeight:1.7,marginBottom:8,fontStyle:"italic"}}>Our team will confirm your booking shortly.</p>
            {result&&result.booking&&result.booking.tokenAmount>0&&(
              <div style={{background:"#fff8ec",border:"1px solid #f0c060",borderRadius:12,padding:"14px 20px",margin:"16px 0",fontFamily:"'DM Sans'"}}>
                <div style={{fontSize:12,color:"#888",marginBottom:4}}>Advance to confirm booking</div>
                <div style={{fontSize:26,fontWeight:700,color:"#d4850a"}}>₹{result.booking.tokenAmount.toLocaleString("en-IN")}</div>
              </div>
            )}
            <button onClick={onClose} style={{marginTop:20,background:"#d4850a",color:"white",border:"none",padding:"12px 28px",borderRadius:12,fontFamily:"'DM Sans'",fontWeight:700,cursor:"pointer"}}>Close</button>
          </div>
        ) : (
          <div>
            <div style={{background:"#fff8ec",border:"1px solid #f0c060",borderRadius:12,padding:"12px 18px",marginBottom:24,fontFamily:"'DM Sans'",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"#888"}}>Package Price</span>
              <span style={{fontSize:20,fontWeight:700,color:"#d4850a"}}>₹{(tour.basePrice||0).toLocaleString("en-IN")} <span style={{fontSize:12,color:"#999",fontWeight:400}}>{tour.priceLabel||"per package"}</span></span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div><label style={lbl}>Your Name *</label><input value={form.customerName} onChange={e=>set("customerName",e.target.value)} placeholder="Full name" style={inp}/></div>
              <div><label style={lbl}>Phone *</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 XXXXX XXXXX" style={inp}/></div>
              <div><label style={lbl}>Travel Date *</label><input type="date" value={form.travelDate} onChange={e=>set("travelDate",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>No. of Persons</label><input type="number" min="1" max={tour.maxPax||20} value={form.pax} onChange={e=>set("pax",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="Optional" style={inp}/></div>
              {tour.pickupPoints&&tour.pickupPoints.length>0&&(
                <div><label style={lbl}>Pickup Point</label>
                  <select value={form.pickupPoint} onChange={e=>set("pickupPoint",e.target.value)} style={inp}>
                    <option value="">Select pickup...</option>
                    {tour.pickupPoints.map((p,i)=><option key={i} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              {isAirport&&<div><label style={lbl}>Flight Number</label><input value={form.flightNumber} onChange={e=>set("flightNumber",e.target.value)} placeholder="e.g. 6E 123" style={inp}/></div>}
            </div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>Special Requests</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Any special requirements..." style={{...inp,resize:"vertical",lineHeight:1.6}}/>
            </div>
            {status==="error"&&<p style={{color:"#e53e3e",fontSize:13,marginBottom:12}}>Something went wrong. Please try again.</p>}
            <button onClick={submit} disabled={status==="sending"} style={{width:"100%",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"14px",borderRadius:12,fontFamily:"'DM Sans'",fontWeight:700,fontSize:15,cursor:status==="sending"?"not-allowed":"pointer",opacity:status==="sending"?0.7:1}}>
              {status==="sending" ? "Submitting..." : "Send Booking Request"}
            </button>
            <p style={{textAlign:"center",fontFamily:"'DM Sans'",fontSize:12,color:"#bbb",marginTop:10}}>No payment now. We will confirm and send payment link.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToursEditor({ data, api, reload, showSaved }) {
  const [subTab, setSubTab]     = useState("packages");
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(null);
  const [adding, setAdding]     = useState(false);
  const [adjModal, setAdjModal] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const tours        = data.tours        || [];
  const tourBookings = data.tourBookings || [];
  const pending      = tourBookings.filter(b=>b.status==="pending");
  const TYPE_LABELS  = {"day-trip":"Day Trip","multi-day":"Multi-Day","taxi":"Taxi","airport":"Airport Pickup"};
  const blank = { title:"", type:"day-trip", destinations:[], description:"", highlights:[], image:"", duration:"", basePrice:0, priceLabel:"per package", maxPax:6, inclusions:[], exclusions:[], itinerary:[], pickupPoints:[], available:true, tag:"" };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const startEdit = (t) => { setForm({...t}); setEditId(t._id); setAdding(false); };
  const startAdd  = () => { setForm({...blank}); setEditId(null); setAdding(true); };
  const saveTour = async () => {
    if (!form.title) { alert("Tour title required"); return; }
    if (adding) await api.post("/tours", form);
    else await api.put("/tours?id="+editId, form);
    await reload(); showSaved("✅ Rental saved!"); setEditId(null); setForm(null); setAdding(false);
  };
  const deleteTour = async (id) => {
    if (!window.confirm("Delete this tour?")) return;
    await api.delete("/tours?id="+id);
    await reload();
  };
  const updateBookingStatus = async (b, status) => {
    await api.put("/tours?bookings=1&id="+b._id, { ...b, status });
    await reload(); showSaved("✅ Saved!");
  };
  const arrField = (key, placeholder) => (
    <div style={{marginBottom:16}}>
      <label className="adm-label">{placeholder}</label>
      {(form[key]||[]).map((v,i)=>(
        <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
          <input className="adm-input" value={v} onChange={e=>{const a=[...(form[key]||[])];a[i]=e.target.value;set(key,a);}} placeholder={placeholder}/>
          <button onClick={()=>set(key,(form[key]||[]).filter((_,j)=>j!==i))} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"8px 12px",borderRadius:8,cursor:"pointer"}}>X</button>
        </div>
      ))}
      <button onClick={()=>set(key,[...(form[key]||[]),""])} style={{fontSize:13,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>+ Add</button>
    </div>
  );
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "-";
  const statusColor = {pending:"#f0c060",confirmed:"#4ade80",completed:"#60a5fa",cancelled:"#ff6b6b"};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontFamily:"'Playfair Display'",fontSize:28}}>Tours & Taxi</h2>
        {subTab==="packages"&&<button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Tour / Taxi</button>}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {[["packages","Packages",tours.length],["bookings","Requests",tourBookings.length]].map(function(item){
          var id=item[0], label=item[1], cnt=item[2];
          return (
            <button key={id} onClick={()=>{setSubTab(id);setEditId(null);setForm(null);setAdding(false);}} style={{padding:"9px 20px",borderRadius:20,border:"2px solid "+(subTab===id?"#d4850a":"rgba(255,255,255,0.1)"),background:subTab===id?"rgba(212,133,10,0.12)":"transparent",color:subTab===id?"#f0c060":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
              {label}
              {pending.length>0&&id==="bookings"&&<span style={{background:"#ef4444",color:"white",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10}}>{pending.length}</span>}
            </button>
          );
        })}
      </div>
      {subTab==="packages" && (
        <div>
          {(adding||editId)&&form&&(
            <div className="adm-card" style={{marginBottom:28,border:"1px solid rgba(212,133,10,0.3)"}}>
              <h3 style={{marginBottom:20,color:"#f0c060"}}>{adding?"Add New Tour / Taxi":"Edit Tour"}</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div style={{gridColumn:"1/-1"}}><label className="adm-label">Tour Title</label><input className="adm-input" value={form.title||""} onChange={e=>set("title",e.target.value)} placeholder="e.g. Coorg Day Trip"/></div>
                <div><label className="adm-label">Type</label>
                  <select className="adm-input" value={form.type} onChange={e=>set("type",e.target.value)}>
                    <option value="day-trip">Day Trip</option>
                    <option value="multi-day">Multi-Day Package</option>
                    <option value="taxi">Taxi / Transfer</option>
                    <option value="airport">Airport Pickup</option>
                  </select>
                </div>
                <div><label className="adm-label">Duration</label><input className="adm-input" value={form.duration||""} onChange={e=>set("duration",e.target.value)} placeholder="e.g. 1 Day / 3D 2N"/></div>
                <div><label className="adm-label">Base Price (Rs.)</label><input className="adm-input" type="number" value={form.basePrice===0||form.basePrice?""+form.basePrice:""} onChange={e=>set("basePrice",e.target.value===""?"":Number(e.target.value))} placeholder="0"/></div>
                <div><label className="adm-label">Price Label</label><input className="adm-input" value={form.priceLabel||""} onChange={e=>set("priceLabel",e.target.value)} placeholder="per package / per person"/></div>
                <div><label className="adm-label">Max Pax</label><input className="adm-input" type="number" value={form.maxPax||6} onChange={e=>set("maxPax",Number(e.target.value))}/></div>
                <div><label className="adm-label">Tag (optional)</label><input className="adm-input" value={form.tag||""} onChange={e=>set("tag",e.target.value)} placeholder="Popular / Best Value"/></div>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:22}}>
                  <label className="adm-label" style={{marginBottom:0}}>Available on website</label>
                  <input type="checkbox" checked={!!form.available} onChange={e=>set("available",e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:"#d4850a"}}/>
                </div>
                <div style={{gridColumn:"1/-1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} rows={3}/></div>
                <div style={{gridColumn:"1/-1"}}><ImageUpload label="Cover Image" value={form.image} onChange={v=>set("image",v)}/></div>
              </div>
              {arrField("destinations","Destinations")}
              {arrField("highlights","Highlights")}
              {arrField("inclusions","Inclusions")}
              {arrField("exclusions","Exclusions")}
              {arrField("pickupPoints","Pickup Points")}
              {form.type==="multi-day"&&(
                <div style={{marginBottom:16}}>
                  <label className="adm-label">Itinerary (Day by Day)</label>
                  {(form.itinerary||[]).map((day,i)=>(
                    <div key={i} className="adm-card" style={{marginBottom:12}}>
                      <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:10,marginBottom:10}}>
                        <div><label className="adm-label">Day</label><input className="adm-input" type="number" value={day.day||i+1} onChange={e=>{const a=[...(form.itinerary||[])];a[i]={...a[i],day:Number(e.target.value)};set("itinerary",a);}}/></div>
                        <div><label className="adm-label">Title</label><input className="adm-input" value={day.title||""} onChange={e=>{const a=[...(form.itinerary||[])];a[i]={...a[i],title:e.target.value};set("itinerary",a);}} placeholder="e.g. Arrival & Sightseeing"/></div>
                      </div>
                      <div style={{marginBottom:8}}><label className="adm-label">Description</label><textarea className="adm-input" value={day.description||""} rows={2} onChange={e=>{const a=[...(form.itinerary||[])];a[i]={...a[i],description:e.target.value};set("itinerary",a);}}/></div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
                        <div><label className="adm-label">Meals</label><input className="adm-input" value={day.meals||""} onChange={e=>{const a=[...(form.itinerary||[])];a[i]={...a[i],meals:e.target.value};set("itinerary",a);}} placeholder="Breakfast & Dinner"/></div>
                        <div><label className="adm-label">Accommodation</label><input className="adm-input" value={day.accommodation||""} onChange={e=>{const a=[...(form.itinerary||[])];a[i]={...a[i],accommodation:e.target.value};set("itinerary",a);}} placeholder="Hotel name"/></div>
                      </div>
                      <button onClick={()=>set("itinerary",(form.itinerary||[]).filter((_,j)=>j!==i))} style={{fontSize:12,color:"#ff6b6b",background:"transparent",border:"1px solid rgba(255,80,80,0.2)",padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>Remove Day</button>
                    </div>
                  ))}
                  <button onClick={()=>set("itinerary",[...(form.itinerary||[]),{day:(form.itinerary||[]).length+1,title:"",description:"",meals:"",accommodation:""}])} style={{fontSize:13,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",padding:"8px 16px",borderRadius:8,cursor:"pointer"}}>+ Add Day</button>
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button onClick={saveTour} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save</button>
                <button onClick={()=>{setEditId(null);setForm(null);setAdding(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          )}
          {tours.length===0&&!adding&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48}}>No tours yet. Add your first package above!</div>}
          <div style={{display:"grid",gap:12}}>
            {tours.filter(t=>t._id!==editId).map(t=>(
              <div key={t._id} className="adm-card" style={{display:"flex",gap:16,alignItems:"center"}}>
                {t.image&&<img src={t.image} alt="" style={{width:70,height:70,objectFit:"cover",borderRadius:10,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:600,fontSize:15}}>{t.title}</span>
                    <span style={{fontSize:11,background:"rgba(255,255,255,0.08)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.5)"}}>{TYPE_LABELS[t.type]}</span>
                    {t.tag&&<span style={{fontSize:11,background:"rgba(212,133,10,0.2)",color:"#f0c060",padding:"2px 8px",borderRadius:10}}>{t.tag}</span>}
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:t.available?"rgba(74,222,128,0.1)":"rgba(255,80,80,0.1)",color:t.available?"#4ade80":"#ff6b6b"}}>{t.available?"Active":"Hidden"}</span>
                  </div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Rs.{(t.basePrice||0).toLocaleString("en-IN")} {t.priceLabel} {t.duration&&"/ "+t.duration} {t.destinations&&t.destinations.length>0&&"/ "+t.destinations.join(", ")}</div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={()=>startEdit(t)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12}}>Edit</button>
                  <button onClick={()=>deleteTour(t._id)} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12}}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {subTab==="bookings" && (
        <div>
          {tourBookings.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:48}}>No tour booking requests yet.</div>}
          <div style={{display:"grid",gap:16}}>
            {tourBookings.map(b=>{
              var sc = statusColor[b.status]||"#f0c060";
              var finalPrice = b.finalPrice||b.basePrice||0;
              var received   = b.receivedAmount||0;
              var remaining  = Math.max(0, finalPrice - received);
              return (
                <div key={b._id} className="adm-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:16}}>{b.customerName}</span>
                        <span style={{fontSize:11,background:"rgba(255,255,255,0.08)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.5)"}}>{TYPE_LABELS[b.tourType]} - {b.tourTitle}</span>
                        <span style={{fontSize:11,padding:"3px 10px",borderRadius:10,background:"rgba(255,255,255,0.08)",color:sc,fontWeight:600,textTransform:"capitalize"}}>{b.status}</span>
                      </div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{b.phone} {b.email&&"/ "+b.email}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Travel Date</div>
                      <div style={{fontWeight:600,color:"#f0c060"}}>{fmt(b.travelDate)}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:12,fontSize:13,color:"rgba(255,255,255,0.6)"}}>
                    <span>Pax: {b.pax}</span>
                    {b.pickupPoint&&<span>Pickup: {b.pickupPoint}</span>}
                    {b.flightNumber&&<span>Flight: {b.flightNumber}</span>}
                  </div>
                  {b.notes&&<div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:12,fontStyle:"italic"}}>"{b.notes}"</div>}
                  <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:16,flexWrap:"wrap"}}>
                    <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Package Price</div><div style={{fontSize:16,fontWeight:700,color:"#60a5fa"}}>Rs.{finalPrice.toLocaleString("en-IN")}</div></div>
                    <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Advance (50%)</div><div style={{fontSize:16,fontWeight:700,color:"#fb923c"}}>Rs.{(b.tokenAmount||0).toLocaleString("en-IN")}</div></div>
                    <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Received</div><div style={{fontSize:16,fontWeight:700,color:"#4ade80"}}>Rs.{received.toLocaleString("en-IN")}</div></div>
                    <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Remaining</div><div style={{fontSize:16,fontWeight:700,color:remaining>0?"#f0c060":"#4ade80"}}>Rs.{remaining.toLocaleString("en-IN")}</div></div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {b.status==="pending"&&(
                      <button onClick={()=>updateBookingStatus(b,"confirmed")} style={{background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Confirm</button>
                    )}
                    {b.status==="pending"&&(
                      <button onClick={async()=>{
                        await updateBookingStatus(b,"cancelled");
                        const fmt2=(d)=>d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—";
                        const msg=[
                          `❌ *Booking Update — Travel Engineers*`,
                          ``,
                          `Hi ${b.customerName},`,
                          ``,
                          `We regret to inform you that we are unable to accommodate your booking request for *${b.tourTitle}* on *${fmt2(b.travelDate)}* due to unavailability of vehicles/resources on that date.`,
                          ``,
                          `We suggest you consider the following alternatives:`,
                          `• Choose a different date for the same tour`,
                          `• Check our other available tour packages`,
                          `• Contact us directly and we will try our best to arrange something suitable for you`,
                          ``,
                          `We apologize for the inconvenience and hope to serve you soon.`,
                          ``,
                          `— Travel Engineers`,
                        ].join("\n");
                        const num=(b.phone||"").replace(/[^0-9]/g,"");
                        const replyNum=num.length===10?"91"+num:num;
                        window.open("https://wa.me/"+replyNum+"?text="+encodeURIComponent(msg),"_blank");
                      }} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",color:"#ff6b6b",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>❌ Cancel & Notify</button>
                    )}
                    {b.status==="confirmed"&&(
                      <button onClick={()=>updateBookingStatus(b,"completed")} style={{background:"rgba(96,165,250,0.15)",border:"1px solid rgba(96,165,250,0.3)",color:"#60a5fa",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Mark Completed</button>
                    )}
                    <button onClick={()=>setAdjModal(b)} style={{background:"rgba(240,192,96,0.1)",border:"1px solid rgba(240,192,96,0.25)",color:"#f0c060",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>Adjust Price</button>
                    <button onClick={()=>setRecordModal(b)} style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.3)",color:"#d4850a",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Record Payment</button>
                    <a href={"https://wa.me/"+(b.phone||"").replace(/[^0-9]/g,"")} target="_blank" rel="noreferrer" style={{background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.25)",color:"#25d366",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6}}>WhatsApp</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {adjModal&&<TourPriceModal booking={adjModal} api={api} reload={reload} showSaved={showSavedLocal} onClose={()=>setAdjModal(null)} />}
      {recordModal&&<TourPaymentModal booking={recordModal} api={api} reload={reload} showSaved={showSavedLocal} onClose={()=>setRecordModal(null)} />}
    </div>
  );
}

function TourPriceModal({ booking, api, reload, showSaved, onClose }) {
  const [price, setPrice]   = useState(booking.finalPrice||booking.basePrice||0);
  const [notes, setNotes]   = useState(booking.adminNotes||"");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const token = Math.ceil(Number(price)*0.5);
    await api.put("/tours?bookings=1&id="+booking._id, {...booking, finalPrice:Number(price), tokenAmount:token, adminNotes:notes});
    await reload(); showSaved("✅ Changes saved!"); onClose(); setSaving(false);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#1a2740",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:"28px",maxWidth:400,width:"100%"}}>
        <h3 style={{fontFamily:"'Playfair Display'",fontSize:20,marginBottom:4}}>Adjust Package Price</h3>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20}}>{booking.tourTitle} / {booking.customerName}</div>
        <label style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Final Price (Rs.)</label>
        <input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"white",fontSize:16,boxSizing:"border-box",marginBottom:8}}/>
        <div style={{background:"rgba(240,192,96,0.06)",border:"1px solid rgba(240,192,96,0.15)",borderRadius:8,padding:"8px 12px",fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
          50% Advance = <span style={{color:"#f0c060",fontWeight:700}}>Rs.{Math.ceil(Number(price)*0.5).toLocaleString("en-IN")}</span>
        </div>
        <label style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Admin Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Reason for price change..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"white",fontSize:13,resize:"vertical",marginBottom:16,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"white",cursor:"pointer",fontWeight:700}}>{saving?"Saving...":"Save Price"}</button>
        </div>
      </div>
    </div>
  );
}

function TourPaymentModal({ booking, api, reload, showSaved, onClose }) {
  const [received, setReceived] = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);
  const finalPrice = booking.finalPrice||booking.basePrice||0;
  const alreadyRec = booking.receivedAmount||0;
  const remaining  = Math.max(0, finalPrice - alreadyRec);
  const save = async () => {
    const amt = Number(received);
    if (!amt||amt<=0) { setError("Enter a valid amount."); return; }
    if (amt>remaining+1) { setError("Max receivable is Rs."+remaining); return; }
    setSaving(true);
    const newReceived = alreadyRec + amt;
    const newStatus   = newReceived >= finalPrice ? "paid" : "partial";
    await api.put("/tours?bookings=1&id="+booking._id, {...booking, receivedAmount:newReceived, paymentStatus:newStatus});
    try {
      const balLeft = Math.max(0, finalPrice - newReceived);
      await api.post("/accounting", { type:"income", category:"tours", amount:amt, description:(alreadyRec>0?"Balance":"Advance")+" - "+booking.tourTitle+" / "+booking.customerName, clientName:booking.customerName, paymentStatus:balLeft>0?"partial":"paid", paymentMethod:"cash", date:new Date().toISOString(), notes:"Tour total: Rs."+finalPrice+" | Received: Rs."+newReceived+" | Remaining: Rs."+balLeft });
      if (balLeft>0) {
        await api.post("/accounting", { type:"income", category:"tours", amount:balLeft, description:"Balance due - "+booking.tourTitle+" / "+booking.customerName, clientName:booking.customerName, paymentStatus:"pending", paymentMethod:"cash", date:new Date().toISOString(), notes:"Tour total: Rs."+finalPrice+" | Paid: Rs."+newReceived+" | Pending: Rs."+balLeft });
      }
    } catch(e) { console.error("Accounting sync:",e); }
    await reload(); showSaved("✅ Changes saved!"); onClose(); setSaving(false);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#1a2740",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:"28px",maxWidth:400,width:"100%"}}>
        <h3 style={{fontFamily:"'Playfair Display'",fontSize:20,marginBottom:4}}>Record Payment</h3>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20}}>{booking.tourTitle} / {booking.customerName}</div>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          {[["Total",finalPrice,"#60a5fa"],["Received",alreadyRec,"#4ade80"],["Remaining",remaining,"#f0c060"]].map(function(item){
            var l=item[0], v=item[1], c=item[2];
            return (
              <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{l}</div>
                <div style={{fontSize:17,fontWeight:700,color:c}}>Rs.{v.toLocaleString("en-IN")}</div>
              </div>
            );
          })}
        </div>
        <label style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Amount Received (Rs.)</label>
        <input type="number" value={received} onChange={e=>{setReceived(e.target.value);setError("");}} placeholder="Enter amount" autoFocus style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"white",fontSize:16,boxSizing:"border-box",marginBottom:8}}/>
        {error&&<div style={{color:"#ff6b6b",fontSize:12,marginBottom:8}}>{error}</div>}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"white",cursor:"pointer",fontWeight:700}}>{saving?"Saving...":"Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ loginInput, setLoginInput, loginError, onLogin, onBack, agency }) {
  const heroImage   = agency?.heroImage   || "";
  const agencyName  = agency?.name        || "Travel Engineers";
  const tagline     = agency?.tagline     || "Paving Your Holidays";
  const heroSub     = agency?.heroSubtitle|| "Scooters · Cars · Bikes · Villa";
  return (
    <div style={{minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",display:"flex",position:"relative",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>
      {/* Full-bleed hero image */}
      <div style={{position:"absolute",inset:0,background:"#0a1628"}}>
        {heroImage && <img src={heroImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.45}} onError={e=>e.target.style.display="none"} />}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,22,40,0.82) 0%,rgba(10,22,40,0.55) 50%,rgba(10,22,40,0.75) 100%)"}}></div>
      </div>
      {/* Left — branding (hidden on mobile) */}
      <div className="login-left" style={{flex:1,position:"relative",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:40}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#d4850a"}}></div>
          <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.6)",letterSpacing:"2px",textTransform:"uppercase"}}>Admin Portal</span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display'",fontSize:"clamp(36px,4vw,60px)",color:"white",lineHeight:1.15,marginBottom:16,fontWeig
