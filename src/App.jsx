// v4
import { useState, useEffect, useRef, useCallback } from "react";
import { ManualBookingModal, CustomerIdPanel } from "./BookingExtensions";

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
      {value && <img src={value} alt="" style={{marginTop:8,width:"100%",height:140,objectFit:"cover",borderRadius:8,opacity:0.8}} onError={e=>{e.target.style.display="none"}} />}
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
        <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>scrollTo("home")}>
          {agency.logoImage
            ? <img src={agency.logoImage} alt="Travel Engineers" style={{height:48,maxWidth:160,objectFit:"contain"}} />
            : <>
                <div style={{width:40,height:40,borderRadius:"50%",border:"1.5px solid rgba(212,133,10,0.6)",background:"rgba(10,22,40,0.8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#d4850a" strokeWidth="1"/>
                    <polygon points="12,3 13.2,11 12,10 10.8,11" fill="#d4850a"/>
                    <polygon points="12,21 13.2,13 12,14 10.8,13" fill="#8a7868"/>
                    <polygon points="3,12 11,10.8 10,12 11,13.2" fill="#8a7868"/>
                    <polygon points="21,12 13,10.8 14,12 13,13.2" fill="#8a7868"/>
                    <circle cx="12" cy="12" r="1.5" fill="#d4850a"/>
                  </svg>
                </div>
                <div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"white",letterSpacing:"0.06em",textTransform:"uppercase"}}>Travel Engineers</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(212,133,10,0.7)",letterSpacing:"0.15em",textTransform:"uppercase"}}>We Know The Way</span>
                </div>
              </>
          }
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
  // Staff login state
  const [staffUser, setStaffUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("staffUser") || "null"); } catch { return null; }
  });
  const [staffLoginOpen, setStaffLoginOpen] = useState(false);
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
    const startTime = Date.now();
    try {
      const [agency, rentals, villa, testimonials, inventory, accounting, bookings, tours, tourBookings, users] = await Promise.all([
        safeGet("/agency", {name:"",tagline:"",heroSubtitle:"",phone:"",email:"",address:"",whatsapp:"",heroImage:""}),
        safeGet("/rentals", []),
        safeGet("/villa", {name:"",tagline:"",description:"",price:"",period:"/night",checkIn:"",checkOut:"",minStay:"",maxGuests:"",image:"",amenities:[],rooms:[]}),
        safeGet("/testimonials", []),
        safeGet("/inventory", []),
        safeGet("/accounting", {transactions:[],summary:{}}),
        safeGet("/bookings", []),
        safeGet("/tours", []),
        safeGet("/tours?bookings=1", []),
        safeGet("/users", []),
      ]);
      setData({ agency, rentals, villa, testimonials, inventory, accounting, bookings, tours, tourBookings, users });
    } catch (err) {
      console.error("API failed:", err);
    }
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 2500 - elapsed);
    setTimeout(() => setLoading(false), remaining);
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
        if (res.success) { setView("admin"); setLoginError(""); setLoginInput(""); sessionStorage.setItem("adminToken", loginInput); }
        else setLoginError("Wrong password!");
      } catch { setLoginError("Error connecting. Try again."); }
    }} onBack={() => setView("home")} />;

  if (view === "pay") return <PayPage />;

  if (view === "staffPanel" && staffUser) return (
    <StaffPanel
      staffUser={staffUser}
      data={data}
      api={api}
      reload={loadAllData}
      onExit={() => {
        setStaffUser(null);
        sessionStorage.removeItem("staffUser");
        setView("home");
        loadAllData();
      }}
    />
  );

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

        {/* Foreground text - unchanged from original */}
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

      <footer style={{background:"#060e1a",padding:"30px 5%",textAlign:"center",borderTop:"1px solid rgba(240,192,60,0.1)"}}>
        <div style={{fontFamily:"'Playfair Display'",fontSize:20,color:"#f0c060",marginBottom:8}}>{agency.name}</div>
        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:"rgba(255,255,255,0.3)",letterSpacing:2,display:"flex",alignItems:"center",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
          <span>© {new Date().getFullYear()}</span>
          <span style={{color:"rgba(255,255,255,0.1)"}}>·</span>
          <span style={{cursor:"pointer",color:"rgba(240,192,96,0.35)"}} onClick={()=>setView("login")}>Admin</span>
          <span style={{color:"rgba(255,255,255,0.1)"}}>·</span>
          <button onClick={()=>setStaffLoginOpen(true)}
            style={{background:"rgba(212,133,10,0.1)",border:"1px solid rgba(212,133,10,0.25)",color:"rgba(240,192,96,0.7)",padding:"5px 14px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans'",letterSpacing:"1px",display:"inline-flex",alignItems:"center",gap:6}}>
            🔐 Staff Login
          </button>
        </div>
      </footer>

      {/* Staff Login Modal */}
      {staffLoginOpen && (
        <StaffLoginModal
          agency={agency}
          onLogin={(user) => {
            setStaffUser(user);
            sessionStorage.setItem("staffUser", JSON.stringify(user));
            setStaffLoginOpen(false);
            setView("staffPanel");
          }}
          onClose={() => setStaffLoginOpen(false)}
        />
      )}

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
  const inp = {width:"100%",padding:"12px 14px",border:"1.5px solid rgba(212,133,10,0.25)",borderRadius:10,fontFamily:"'DM Sans'",fontSize:14,outline:"none",color:"#1a1a2e",background:"white",boxSizing:"border-box"};
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
                  <select value={form.pickupPoint} onChange={e=>set("pickupPoint",e.target.value)} style={{...inp,appearance:"none",WebkitAppearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4850a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:32}}>
                    <option value="">Select pickup point…</option>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .login-left{flex:1;position:relative;display:flex;flex-direction:column;justify-content:center;padding:60px 64px;z-index:1;}
        .login-card{width:420px;flex-shrink:0;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;padding:40px 48px;background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border-left:1px solid rgba(255,255,255,0.08);}
        @media(max-width:768px){
          .login-left{display:none!important;}
          .login-card{width:100vw!important;min-width:0!important;max-width:100vw!important;border-left:none!important;padding:48px 24px!important;min-height:100vh;box-sizing:border-box;}
        }
      `}</style>
      {/* Full-bleed hero image */}
      <div style={{position:"absolute",inset:0,background:"#0a1628"}}>
        {heroImage && <img src={heroImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.45}} onError={e=>{e.target.style.display="none"}} />}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,22,40,0.82) 0%,rgba(10,22,40,0.55) 50%,rgba(10,22,40,0.75) 100%)"}}></div>
      </div>
      {/* Left - branding (hidden on mobile) */}
      <div className="login-left">
        <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:40}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#d4850a"}}></div>
          <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.6)",letterSpacing:"2px",textTransform:"uppercase"}}>Admin Portal</span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display'",fontSize:"clamp(36px,4vw,60px)",color:"white",lineHeight:1.15,marginBottom:16,fontWeight:700}}>
          {agencyName}
        </h1>
        <p style={{fontSize:"clamp(18px,2vw,26px)",color:"#f0c060",fontWeight:500,marginBottom:12,letterSpacing:"0.5px"}}>{tagline}</p>
        <p style={{fontSize:15,color:"rgba(255,255,255,0.5)",letterSpacing:"1.5px"}}>{heroSub}</p>
        <div style={{marginTop:48,display:"flex",gap:16,flexWrap:"wrap"}}>
          {["Vehicle Rentals","Villa Stays","Tours & Taxi"].map(s=>(
            <span key={s} style={{padding:"6px 16px",borderRadius:20,border:"1px solid rgba(240,192,96,0.25)",color:"rgba(255,255,255,0.5)",fontSize:12,letterSpacing:"0.5px"}}>{s}</span>
          ))}
        </div>
      </div>
      {/* Right - login card */}
      <div className="login-card">
        <div style={{width:"100%"}}>
          <div style={{width:52,height:52,background:"rgba(212,133,10,0.15)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28,color:"#f0c060"}}><Icon name="lock" size={22}/></div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,color:"white",marginBottom:6}}>Welcome back</h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:32}}>Sign in to manage your agency</p>
          <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:8}}>Password</label>
          <input type="password" placeholder="Enter your password" value={loginInput}
            onChange={e=>setLoginInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()}
            style={{width:"100%",padding:"14px 18px",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,color:"white",fontFamily:"'DM Sans'",fontSize:15,outline:"none",marginBottom:12,boxSizing:"border-box",transition:"border-color 0.2s"}} />
          {loginError&&<p style={{color:"#ff6b6b",fontSize:13,marginBottom:12}}>{loginError}</p>}
          <button onClick={onLogin} style={{width:"100%",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"15px",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:16,fontFamily:"'DM Sans'",letterSpacing:"0.3px"}}>
            Sign In
          </button>
          <div style={{textAlign:"center"}}>
            <button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.35)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans'"}}>← Back to website</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel Shell ───────────────────────────────────────────────────────
function AdminPanel({ data, api, reload, saved, showSaved, onExit, adminTab, setAdminTab }) {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };
  // Override showSaved to also show local toast
  const showSavedLocal = (msg="✅ Changes saved!", type="success") => { showSaved(msg, type); showToast(msg, type); };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const tabs = [
    {id:"dashboard",   label:"Dashboard",   icon:"⊞"},
    {id:"agency",      label:"Agency Info",  icon:"🏢"},
    {id:"rentals",     label:"Rentals",      icon:"🛵"},
    {id:"villa",       label:"Villa",        icon:"🏡"},
    {id:"testimonials",label:"Reviews",      icon:"⭐"},
    {id:"inventory",   label:"Inventory",    icon:"📦"},
    {id:"tours",       label:"Tours & Taxi", icon:"🗺", badge: (data.tourBookings||[]).filter(b=>b.status==="pending").length},
    {id:"accounting",  label:"Accounting",   icon:"💰"},
    {id:"bookings",    label:"Bookings",     icon:"📋", badge: (data.bookings||[]).filter(b=>b.status==="pending").length},
    {id:"users",       label:"Users",        icon:"👤"},
  ];
  const goTo = (id) => { setAdminTab(id); reload(); };
  return (
    <div style={{minHeight:"100vh",background:"#f5f6fa",fontFamily:"'DM Sans',sans-serif",color:"#1a1a2e",display:"flex",position:"relative"}}>
      {/* Toast Notification */}
      {toast&&(
        <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.type==="delete"?"#ef4444":toast.type==="error"?"#ef4444":"#16a34a",color:"white",padding:"13px 28px",borderRadius:12,fontFamily:"'DM Sans'",fontSize:15,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap"}}>
          {toast.type==="delete"?"🗑️":toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .adm-input{width:100%;padding:10px 14px;background:#0d1b2e;border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;color:#ffffff;font-family:'DM Sans';font-size:14px;outline:none;transition:border-color 0.2s;}
        .adm-input:focus{border-color:#d4850a;background:#0f2035;}
        .adm-input::placeholder{color:rgba(255,255,255,0.25);}
        textarea.adm-input{resize:vertical;min-height:80px;line-height:1.6;}
        select.adm-input{cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
        select.adm-input option{background:#0d1b2e;color:#ffffff;}
        select.adm-input optgroup{background:#081425;color:#f0c060;font-weight:700;}
        input[type="date"].adm-input{color-scheme:dark;}
        input[type="number"].adm-input::-webkit-inner-spin-button{opacity:0.5;}
        label.adm-label{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
        .adm-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;}
        select.adm-input{cursor:pointer;} 
        .adm-stat{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;}
        .tags-nav-btn{width:100%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;font-family:'DM Sans';font-size:14px;font-weight:500;transition:all 0.15s;text-align:left;}
        .tags-nav-btn:hover{background:rgba(212,133,10,0.12);}
        .tags-nav-btn.active{background:linear-gradient(135deg,#d4850a,#f0c060);color:#1a1a2e!important;font-weight:700;}
        .tags-stat-card{background:rgba(255,255,255,0.04);border-radius:16px;padding:22px 24px;border:1px solid rgba(255,255,255,0.08);}
        .tags-content{flex:1;overflow-y:auto;height:100vh;background:#0d1b2e;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#d4850a55;border-radius:10px;}
      `}</style>
      {/* Sidebar */}
      <div style={{width:sidebarOpen?220:68,flexShrink:0,background:"#0a1421",borderRight:"1px solid rgba(240,192,96,0.1)",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,transition:"width 0.2s",overflow:"hidden"}}>
        <div style={{padding:"20px 14px 16px",borderBottom:"1px solid rgba(240,192,96,0.1)",display:"flex",alignItems:"center",gap:10,minHeight:64}}>
          <div style={{width:36,height:36,background:"#d4850a",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:"white",fontWeight:700}}>T</div>
          {sidebarOpen && <div><div style={{fontWeight:700,fontSize:14,color:"#f0c060",lineHeight:1.2}}>Travel Engineers</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Admin Panel</div></div>}
        </div>
        <button onClick={()=>setSidebarOpen(o=>!o)} style={{margin:"10px auto",width:28,height:28,borderRadius:7,border:"1px solid rgba(240,192,96,0.15)",background:"rgba(255,255,255,0.04)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"rgba(255,255,255,0.4)",flexShrink:0}}>
          {sidebarOpen?"◀":"▶"}
        </button>
        <nav style={{flex:1,padding:"4px 8px",overflowY:"auto"}}>
          {tabs.map(t=>(
            <button key={t.id} className={"tags-nav-btn"+(adminTab===t.id?" active":"")} style={{color:adminTab===t.id?"#1a1a2e":"rgba(255,255,255,0.55)",marginBottom:2}} onClick={()=>goTo(t.id)}>
              <span style={{fontSize:16,flexShrink:0,width:20,textAlign:"center"}}>{t.icon}</span>
              {sidebarOpen&&<span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.label}</span>}
              {sidebarOpen&&t.badge>0&&<span style={{background:"#ef4444",color:"white",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10,minWidth:18,textAlign:"center",flexShrink:0}}>{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:"1px solid rgba(240,192,96,0.1)"}}>
          <button onClick={onExit} className="tags-nav-btn" style={{color:"rgba(255,255,255,0.4)"}}>
            <span style={{fontSize:16,flexShrink:0,width:20,textAlign:"center"}}>↗</span>
            {sidebarOpen&&<span>View Site</span>}
          </button>
        </div>
      </div>
      {/* Main */}
      <div className="tags-content">
        <div style={{background:"#0a1421",borderBottom:"1px solid rgba(240,192,96,0.1)",padding:"0 28px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:"#f0c060",fontFamily:"'Playfair Display'"}}>{tabs.find(t=>t.id===adminTab)?.label||"Dashboard"}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{adminTab==="dashboard"?"Overview & quick stats":`Manage your ${(tabs.find(t=>t.id===adminTab)?.label||"").toLowerCase()}`}</div>
          </div>
          {saved&&<span style={{color:"#16a34a",fontSize:13,fontWeight:600}}>✓ Saved!</span>}
        </div>
        <div style={{padding:adminTab==="dashboard"?"28px":"0"}}>
          {adminTab==="dashboard"&&<AdminDashboard data={data} goTo={goTo}/>}
          {adminTab!=="dashboard"&&(
            <div style={{background:"#0d1b2e",color:"white",minHeight:"100%",padding:"32px"}}>
              {adminTab==="agency"       &&<AgencyEditor       data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="rentals"      &&<RentalsEditor      data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="villa"        &&<VillaEditor        data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="testimonials" &&<TestimonialsEditor data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="inventory"    &&<InventoryEditor    data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="accounting"   &&<AccountingEditor   data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="bookings"     &&<BookingsEditor     data={data} api={api} reload={reload} showSaved={showSavedLocal} rentals={data.rentals||[]}/>}
              {adminTab==="tours"        &&<ToursEditor        data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
              {adminTab==="users"        &&<UsersEditor        data={data} api={api} reload={reload} showSaved={showSavedLocal}/>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ data, goTo }) {
  const bookings     = data.bookings     || [];
  const tourBookings = data.tourBookings || [];
  const rentals      = data.rentals      || [];
  const accData      = data.accounting   || { summary:{totalIncome:0,totalExpense:0,netProfit:0}, transactions:[] };
  const pendingBookings   = bookings.filter(b=>b.status==="pending");
  const confirmedBookings = bookings.filter(b=>b.status==="confirmed");
  const pendingTours      = tourBookings.filter(b=>b.status==="pending");
  const income     = accData.summary?.totalIncome  || 0;
  const expense    = accData.summary?.totalExpense || 0;
  const profit     = income - expense;
  const available  = rentals.filter(r=>r.available).length;
  const fmt      = (n) => `₹${Number(n||0).toLocaleString("en-IN")}`;
  const fmtDate  = (d) => d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—";
  const statCards = [
    {label:"Total Bookings",     value:bookings.length,     sub:`${pendingBookings.length} pending`,   color:"#d4850a",bg:"#fff8ec",icon:"📋",tab:"bookings"},
    {label:"Vehicles Available", value:available,           sub:`of ${rentals.length} total`,          color:"#2563eb",bg:"#eff6ff",icon:"🛵",tab:"rentals"},
    {label:"Net Profit",         value:fmt(profit),         sub:`Income ${fmt(income)}`,               color:"#16a34a",bg:"#f0fdf4",icon:"💰",tab:"accounting"},
    {label:"Tour Bookings",      value:tourBookings.length, sub:`${pendingTours.length} need action`,  color:"#7c3aed",bg:"#f5f3ff",icon:"🗺",tab:"tours"},
  ];
  const recentBookings = [...bookings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const pendingActions = [
    ...pendingBookings.map(b=>({label:`New booking — ${b.customerName}`,sub:`${b.vehicleName} · ${fmtDate(b.checkIn)}`,color:"#d4850a",tab:"bookings",type:"booking"})),
    ...pendingTours.map(b=>({label:`Tour request — ${b.customerName}`,sub:b.tourTitle||"Tour",color:"#7c3aed",tab:"tours",type:"tour"})),
  ].slice(0,6);
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:26,fontWeight:700,color:"#1a1a2e"}}>Welcome back 👋</h1>
        <p style={{color:"#6b7280",fontSize:14,marginTop:4}}>Here's what's happening with Travel Engineers this month.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        {statCards.map(c=>(
          <div key={c.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"22px 24px",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}} onClick={()=>goTo(c.tab)}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{c.label}</span>
              <div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{c.icon}</div>
            </div>
            <div style={{fontSize:28,fontWeight:700,color:c.color,lineHeight:1}}>{c.value}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:6}}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"22px 24px",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#f0c060",marginBottom:4}}>🔔 Pending Actions</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:16}}>{pendingActions.length} items need your attention</div>
          {pendingActions.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontSize:13}}>All caught up!</div></div>}
          {pendingActions.map((a,i)=>(
            <div key={i} onClick={()=>goTo(a.tab)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<pendingActions.length-1?"1px solid rgba(255,255,255,0.06)":"none",cursor:"pointer"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:a.color,flexShrink:0}}></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.label}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sub}</div>
              </div>
              <span style={{fontSize:11,background:a.color+"18",color:a.color,padding:"2px 8px",borderRadius:6,fontWeight:600,flexShrink:0,textTransform:"capitalize"}}>{a.type}</span>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"22px 24px",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontWeight:700,fontSize:15,color:"#f0c060"}}>📋 Recent Bookings</div>
            <button onClick={()=>goTo("bookings")} style={{fontSize:12,color:"#f0c060",background:"rgba(212,133,10,0.15)",border:"none",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontWeight:600,fontFamily:"'DM Sans'"}}>View all</button>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:16}}>Latest vehicle bookings</div>
          {recentBookings.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><div style={{fontSize:13}}>No bookings yet</div></div>}
          {recentBookings.map((b,i)=>{
            const sc={pending:"#f59e0b",confirmed:"#16a34a",payment_requested:"#2563eb",cancelled:"#ef4444",completed:"#6b7280"}[b.status]||"#6b7280";
            return(
              <div key={b._id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<recentBookings.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(212,133,10,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🛵</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.customerName}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{b.vehicleName} · {fmtDate(b.checkIn)}</div>
                </div>
                <span style={{fontSize:11,background:sc+"18",color:sc,padding:"2px 8px",borderRadius:6,fontWeight:600,flexShrink:0,textTransform:"capitalize"}}>{(b.status||"").replace("_"," ")}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"22px 24px",border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontWeight:700,fontSize:15,color:"#f0c060",marginBottom:16}}>⚡ Quick Actions</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[
            {label:"+ Add Rental",    color:"#2563eb",tab:"rentals"},
            {label:"+ Add Tour",      color:"#7c3aed",tab:"tours"},
            {label:"View Accounting", color:"#16a34a",tab:"accounting"},
            {label:"Manage Inventory",color:"#d4850a",tab:"inventory"},
            {label:"Edit Agency Info", color:"#6b7280",tab:"agency"},
          ].map(q=>(
            <button key={q.label} onClick={()=>goTo(q.tab)} style={{padding:"9px 18px",borderRadius:8,border:`1.5px solid ${q.color}22`,background:`${q.color}10`,color:q.color,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans'"}}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agency Editor (unchanged) ───────────────────────────────────────────────
function AgencyEditor({ data, api, reload, showSaved }) {
  const [form, setForm] = useState(data.agency);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Always load fresh data from MongoDB when editor opens
  useEffect(() => {
    api.get("/agency").then(fresh => {
      if (fresh && fresh._id) setForm(fresh);
    }).catch(() => {});
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put("/agency", form);
      if (res && (res._id || res.name)) {
        await reload();
        showSaved("✅ Agency info saved!");
      } else {
        showSaved("❌ Save failed!","error");
      }
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
    setSaving(false);
  };
  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,marginBottom:24}}>Agency Information</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {[["Agency Name","name"],["Tagline","tagline"],["Hero Subtitle","heroSubtitle"],["Phone","phone"],["Email","email"],["WhatsApp Number","whatsapp"]].map(([l,k])=>(
          <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
        ))}
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Address</label><input className="adm-input" value={form.address||""} onChange={e=>set("address",e.target.value)}/></div>
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Office Google Maps URL</label><input className="adm-input" value={form.googleMapUrl||""} onChange={e=>set("googleMapUrl",e.target.value)} placeholder="https://maps.google.com/..."/><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>Paste the Google Maps share link for your office location</div></div>
        <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Hero Image" value={form.heroImage} onChange={v=>set("heroImage",v)}/></div>
        <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Agency Logo" value={form.logoImage} onChange={v=>set("logoImage",v)}/><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>Upload your agency logo (shown in navbar and footer)</div></div>
      </div>
      <button onClick={save} disabled={saving} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1}}>{saving?"Saving...":"Save Changes"}</button>
    </div>
  );
}

// ─── Rentals Editor (unchanged) ──────────────────────────────────────────────
function RentalsEditor({ data, api, reload, showSaved }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const blank = {type:"scooty",name:"",vehicleNo:"",category:"Scooty",price:"",period:"/day",tag:"",description:"",features:[""],image:"",available:true};
  const startEdit = (r) => { setForm({...r,features:[...(r.features||[])]}); setEditId(r._id); setAdding(false); };
  const startAdd = () => { setForm({...blank}); setEditId(null); setAdding(true); };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const saveRental = async () => {
    if (adding) await api.post("/rentals", form);
    else await api.put(`/rentals/${editId}`, form);
    await reload(); showSaved("✅ Rental saved!"); setEditId(null); setForm(null); setAdding(false);
  };
  const deleteRental = async (id) => { if(window.confirm("Delete this vehicle?")){ await api.delete(`/rentals/${id}`); await reload(); showSaved("🗑️ Vehicle deleted","delete"); } };
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
            {[["Vehicle Name","name"],["Vehicle No.","vehicleNo"],["Price","price"],["Period","period"],["Tag (optional)","tag"]].map(([l,k])=>(
              <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={k==="vehicleNo"?"e.g. 9654":""}/></div>
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
                {r.vehicleNo&&<span style={{fontSize:11,background:"rgba(212,133,10,0.15)",padding:"2px 8px",borderRadius:10,color:"#f0c060",fontWeight:600}}>#{r.vehicleNo}</span>}
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
function VillaEditor({ data, api, reload, showSaved }) {
  const [form, setForm] = useState({...data.villa});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Always load fresh data from MongoDB when editor opens
  useEffect(() => {
    api.get("/villa").then(fresh => {
      if (fresh && fresh._id) setForm(fresh);
    }).catch(() => {});
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put("/villa", form);
      if (res && res._id) { await reload(); showSaved("✅ Villa saved!"); }
      else { alert("❌ Save failed: " + JSON.stringify(res)); }
    } catch(err) { alert("❌ Error: " + err.message); }
    setSaving(false);
  };
  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,marginBottom:24}}>Villa Details</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {[["Villa Name","name"],["Tagline","tagline"],["Price","price"],["Period","period"],["Check-in","checkIn"],["Check-out","checkOut"],["Min Stay","minStay"],["Max Guests","maxGuests"]].map(([l,k])=>(
          <div key={k}><label className="adm-label">{l}</label><input className="adm-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
        ))}
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)}/></div>
        <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Villa Image" value={form.image} onChange={v=>set("image",v)}/></div>
        <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Google Maps URL</label><input className="adm-input" value={form.googleMapUrl||""} onChange={e=>set("googleMapUrl",e.target.value)} placeholder="https://maps.google.com/..."/><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>Paste the Google Maps share link for your villa location</div></div>
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
      <button onClick={save} disabled={saving} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1}}>{saving?"Saving...":"Save Changes"}</button>
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
    setEditId(null); setForm(null); showSaved("✅ Item saved!"); await reload();
  };
  const del = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    setLocalList(l=>l.filter(t=>t._id!==id));
    await api.delete(`/testimonials/${id}`); await reload(); showSaved("🗑️ Review deleted","delete");
  };
  const approve = async (t) => {
    setActionId(t._id+"_approve");
    setLocalList(l=>l.map(r=>r._id===t._id?{...r,approved:true}:r));
    try { await api.put(`/testimonials/${t._id}`,{...t,approved:true}); showSaved("✅ Review approved!"); await reload(); }
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
  available:   { bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.3)",  color:"#4ade80",  label:"Available",   dot:"#4ade80" },
  booked:      { bg:"rgba(240,192,96,0.12)",  border:"rgba(240,192,96,0.3)",  color:"#f0c060",  label:"Booked",      dot:"#f0c060" },
  maintenance: { bg:"rgba(255,100,100,0.12)", border:"rgba(255,100,100,0.3)", color:"#ff6b6b",  label:"Maintenance", dot:"#ff6b6b" },
};

function InventoryEditor({ data, api, reload, showSaved }) {
  const blankItem = { type:"vehicle", vehicleType:"scooty", name:"", description:"", status:"available", pricePerDay:0, capacity:1, location:"", image:"", notes:"" };
  const [items, setItems] = useState(data.inventory||[]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("list"); // list | grid
  const [filterDate, setFilterDate] = useState(""); // date string YYYY-MM-DD

  useEffect(()=>setItems(data.inventory||[]),[data.inventory]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const startAdd  = () => { setForm({...blankItem}); setEditId(null); setAdding(true); window.scrollTo({top:0,behavior:"smooth"}); };
  const startEdit = (item) => { setForm({...item}); setEditId(item._id); setAdding(false); window.scrollTo({top:0,behavior:"smooth"}); };
  const cancel    = () => { setEditId(null); setForm(null); setAdding(false); };

  const save = async () => {
    if (!form.name.trim()) { alert("Please enter a name."); return; }
    if (adding) await api.post("/inventory", form);
    else        await api.put(`/inventory/${editId}`, form);
    cancel(); showSaved("✅ Changes saved!"); await reload();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    setItems(l=>l.filter(i=>i._id!==id));
    await api.delete(`/inventory/${id}`); await reload(); showSaved("🗑️ Item deleted","delete");
  };

  const updateStatus = async (item, status) => {
    setItems(l=>l.map(i=>i._id===item._id?{...i,status}:i));
    await api.put(`/inventory/${item._id}`, {...item, status});
    await reload();
  };

  // Counts
  const counts = { all:items.length, tour:0, villa:0, vehicle:0, equipment:0 };
  items.forEach(i=>{ if(counts[i.type]!==undefined) counts[i.type]++; });
  const statusCounts = { available:0, booked:0, maintenance:0 };
  items.forEach(i=>{ if(statusCounts[i.status]!==undefined) statusCounts[i.status]++; });
  const totalFleetValue = items.filter(i=>i.pricePerDay>0).reduce((s,i)=>s+i.pricePerDay,0);

  // Filter + search + sort
  let filtered = items;
  if (filterType!=="all") filtered = filtered.filter(i=>i.type===filterType);
  if (filterStatus!=="all") filtered = filtered.filter(i=>i.status===filterStatus);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i=>(i.name||"").toLowerCase().includes(q)||(i.location||"").toLowerCase().includes(q)||(i.description||"").toLowerCase().includes(q));
  }
  if (sortBy==="name")     filtered = [...filtered].sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  if (sortBy==="price")    filtered = [...filtered].sort((a,b)=>(b.pricePerDay||0)-(a.pricePerDay||0));
  if (sortBy==="status")   filtered = [...filtered].sort((a,b)=>(a.status||"").localeCompare(b.status||""));

  // Date availability filter - check if item is booked on the selected date
  const getStatusForDate = (item) => {
    if (!filterDate || !item.activeBookings) return item.status;
    const d = new Date(filterDate); d.setHours(12,0,0,0);
    const isBooked = item.activeBookings.some(b => {
      const from = b.from ? new Date(b.from) : null;
      const to   = b.to   ? new Date(b.to)   : null;
      return from && to && d >= from && d <= to;
    });
    return isBooked ? "booked" : "available";
  };

  const exportCSV = () => {
    const rows = [["Name","Type","Vehicle Type","Status","Price/Day","Capacity","Location","Notes"]];
    filtered.forEach(i=>rows.push([i.name,i.type,i.vehicleType||"",i.status,i.pricePerDay,i.capacity,i.location,i.notes]));
    const csv = rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="inventory.csv"; a.click();
  };

  const typeIcon = (item) => item.type==="vehicle"?(item.vehicleType==="scooty"?"🛵":item.vehicleType==="bike"?"🏍️":"🚗"):item.type==="tour"?"🗺️":item.type==="villa"?"🏡":"🔧";

  return (
    <div>
      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:30,marginBottom:4}}>Inventory</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",letterSpacing:1}}>{items.length} total assets · ₹{totalFleetValue.toLocaleString("en-IN")}/day fleet value</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={exportCSV} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.6)",padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>↓ Export CSV</button>
          <button onClick={startAdd} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Item</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        {[
          {label:"Total Items",  value:counts.all,            color:"#f0c060", icon:"📦"},
          {label:"Vehicles",     value:counts.vehicle,        color:"#60a5fa", icon:"🛵"},
          {label:"Tours",        value:counts.tour,           color:"#a78bfa", icon:"🗺️"},
          {label:"Equipment",    value:counts.equipment,      color:"#fb923c", icon:"🔧"},
          {label:"Available",    value:statusCounts.available,    color:"#4ade80", icon:"✅"},
          {label:"Booked",       value:statusCounts.booked,       color:"#f0c060", icon:"📅"},
          {label:"Maintenance",  value:statusCounts.maintenance,  color:"#ff6b6b", icon:"🔧"},
        ].map(s=>(
          <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:10,right:12,fontSize:18,opacity:0.18}}>{s.icon}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Playfair Display'"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Availability Bar ── */}
      {items.length>0&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 20px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1}}>Fleet availability</span>
            <span style={{fontSize:11,color:"#4ade80",fontWeight:600}}>{Math.round((statusCounts.available/items.length)*100)}% available</span>
          </div>
          <div style={{display:"flex",height:8,borderRadius:6,overflow:"hidden",gap:2}}>
            {statusCounts.available>0&&<div style={{flex:statusCounts.available,background:"#4ade80",borderRadius:6}}/>}
            {statusCounts.booked>0&&<div style={{flex:statusCounts.booked,background:"#f0c060",borderRadius:6}}/>}
            {statusCounts.maintenance>0&&<div style={{flex:statusCounts.maintenance,background:"#ff6b6b",borderRadius:6}}/>}
          </div>
          <div style={{display:"flex",gap:16,marginTop:8}}>
            {[["#4ade80","Available",statusCounts.available],["#f0c060","Booked",statusCounts.booked],["#ff6b6b","Maintenance",statusCounts.maintenance]].map(([c,l,v])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.4)"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>{l}: <strong style={{color:"rgba(255,255,255,0.7)"}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Date Availability Filter ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 18px",marginBottom:12,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>📅 Check date:</span>
        <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
          style={{padding:"8px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"white",fontSize:13,outline:"none",cursor:"pointer"}}/>
        {filterDate&&(
          <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:12,padding:"4px 12px",borderRadius:20,background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",color:"#4ade80"}}>
              ✅ {items.filter(i=>getStatusForDate(i)==="available").length} available
            </span>
            <span style={{fontSize:12,padding:"4px 12px",borderRadius:20,background:"rgba(255,100,100,0.1)",border:"1px solid rgba(255,100,100,0.2)",color:"#ff6b6b"}}>
              📅 {items.filter(i=>getStatusForDate(i)==="booked").length} booked
            </span>
            <button onClick={()=>setFilterDate("")} style={{fontSize:11,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"4px 10px",borderRadius:6,cursor:"pointer"}}>Clear ✕</button>
          </div>
        )}
        {!filterDate&&<span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>Pick a date to see what's available or booked</span>}
      </div>

      {/* ── Search + Filters ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          {/* Search */}
          <div style={{flex:1,minWidth:180,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.4}}>🔍</span>
            <input className="adm-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, location…" style={{paddingLeft:34}}/>
          </div>
          {/* Type filter */}
          <select className="adm-input" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:"auto",minWidth:130}}>
            <option value="all">All Types ({counts.all})</option>
            <option value="vehicle">🛵 Vehicles ({counts.vehicle})</option>
            <option value="tour">🗺️ Tours ({counts.tour})</option>
            <option value="villa">🏡 Villa ({counts.villa})</option>
            <option value="equipment">🔧 Equipment ({counts.equipment})</option>
          </select>
          {/* Status filter */}
          <select className="adm-input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:"auto",minWidth:140}}>
            <option value="all">All Statuses</option>
            <option value="available">✅ Available ({statusCounts.available})</option>
            <option value="booked">📅 Booked ({statusCounts.booked})</option>
            <option value="maintenance">🔧 Maintenance ({statusCounts.maintenance})</option>
          </select>
          {/* Sort */}
          <select className="adm-input" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"auto",minWidth:120}}>
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price ↓</option>
            <option value="status">Sort: Status</option>
          </select>
          {/* View toggle */}
          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:4}}>
            {[["list","☰"],["grid","⊞"]].map(([m,icon])=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{padding:"5px 10px",borderRadius:6,border:"none",background:viewMode===m?"rgba(212,133,10,0.25)":"transparent",color:viewMode===m?"#f0c060":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14}}>{icon}</button>
            ))}
          </div>
        </div>
        {(search||filterType!=="all"||filterStatus!=="all")&&(
          <div style={{marginTop:10,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Showing {filtered.length} of {items.length}</span>
            <button onClick={()=>{setSearch("");setFilterType("all");setFilterStatus("all");}} style={{fontSize:11,color:"#f0c060",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear filters</button>
          </div>
        )}
      </div>

      {/* ── Add / Edit Form ── */}
      {(adding||editId)&&form&&(
        <div className="adm-card" style={{marginBottom:24,border:"1px solid rgba(212,133,10,0.35)",background:"rgba(212,133,10,0.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h3 style={{color:"#f0c060",fontSize:18}}>{adding?"➕ Add New Item":"✏️ Edit Item"}</h3>
            <button onClick={cancel} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
          </div>
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
                <option value="available">✅ Available</option>
                <option value="booked">📅 Booked</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
            </div>
            <div><label className="adm-label">Price per day (₹)</label><input className="adm-input" type="number" value={form.pricePerDay||0} onChange={e=>set("pricePerDay",Number(e.target.value))}/></div>
            <div><label className="adm-label">Capacity (guests/units)</label><input className="adm-input" type="number" value={form.capacity||1} onChange={e=>set("capacity",Number(e.target.value))}/></div>
            <div><label className="adm-label">Location</label><input className="adm-input" value={form.location||""} onChange={e=>set("location",e.target.value)} placeholder="e.g. Main Garage, Udaipur"/></div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><textarea className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} rows={2}/></div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Notes (internal)</label><textarea className="adm-input" value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Service history, quirks, etc."/></div>
            <div style={{gridColumn:"1 / -1"}}><ImageUpload label="Image" value={form.image} onChange={v=>set("image",v)}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 28px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save Item</button>
            <button onClick={cancel} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Items - List View ── */}
      {viewMode==="list"&&(
        <div style={{display:"grid",gap:8}}>
          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)"}}>
              <div style={{fontSize:40,marginBottom:12}}>📦</div>
              <div style={{fontSize:14}}>{search?"No results found":"No items yet — click + Add Item above"}</div>
            </div>
          )}
          {filtered.map(item=>{
            const dateStatus = getStatusForDate(item);
            const ss = STATUS_STYLES[dateStatus]||STATUS_STYLES.available;
            const icon = typeIcon(item);
            return (
              <div key={item._id} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${filterDate&&dateStatus==="booked"?"rgba(255,100,100,0.4)":filterDate&&dateStatus==="available"?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:14,alignItems:"center",transition:"border-color 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=filterDate&&dateStatus==="booked"?"rgba(255,100,100,0.6)":filterDate&&dateStatus==="available"?"rgba(74,222,128,0.5)":"rgba(212,133,10,0.3)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=filterDate&&dateStatus==="booked"?"rgba(255,100,100,0.4)":filterDate&&dateStatus==="available"?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.07)"}>
                {item.image
                  ? <img src={item.image} alt="" style={{width:56,height:56,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
                  : <div style={{width:56,height:56,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:600,fontSize:15}}>{item.name}</span>
                    <span style={{fontSize:10,background:"rgba(255,255,255,0.06)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1}}>{icon} {item.type}</span>
                    <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color,display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:ss.dot,display:"inline-block"}}/>
                      {ss.label}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",display:"flex",gap:14,flexWrap:"wrap"}}>
                    {item.pricePerDay>0&&<span style={{color:"#f0c060",fontWeight:600}}>₹{item.pricePerDay.toLocaleString("en-IN")}/day</span>}
                    {item.capacity>0&&<span>👥 {item.capacity} capacity</span>}
                    {item.location&&<span>📍 {item.location}</span>}
                    {item.description&&<span style={{maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description}</span>}
                  </div>
                  {/* Show active booking dates */}
                  {(item.activeBookings||[]).length>0&&(
                    <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {item.activeBookings.map((b,i)=>{
                        const fmt=(d)=>d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"?";
                        return <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(240,192,96,0.1)",border:"1px solid rgba(240,192,96,0.25)",color:"#f0c060"}}>
                          📅 {fmt(b.from)} → {fmt(b.to)} · {b.customerName||""}
                        </span>;
                      })}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end",alignItems:"center"}}>
                  {filterDate ? (
                    <span style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${ss.border}`,background:ss.bg,color:ss.color,fontSize:11,fontWeight:600}}>
                      {dateStatus==="booked"?"📅 Booked on date":"✅ Free on date"}
                    </span>
                  ) : (
                    <select value={item.status} onChange={e=>updateStatus(item,e.target.value)}
                      style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${ss.border}`,background:"#0d1b2e",color:ss.color,fontSize:11,cursor:"pointer",fontWeight:600,outline:"none",appearance:"none",WebkitAppearance:"none",paddingRight:22,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 5px center"}}>
                      <option value="available" style={{background:"#0d1b2e",color:"white"}}>✅ Available</option>
                      <option value="booked" style={{background:"#0d1b2e",color:"white"}}>📅 Booked</option>
                      <option value="maintenance" style={{background:"#0d1b2e",color:"white"}}>🔧 Maintenance</option>
                    </select>
                  )}
                  <button onClick={()=>startEdit(item)} style={{background:"rgba(212,133,10,0.12)",border:"1px solid rgba(212,133,10,0.25)",color:"#f0c060",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12}}>Edit</button>
                  <button onClick={()=>del(item._id)} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.15)",color:"#ff6b6b",padding:"6px 10px",borderRadius:7,cursor:"pointer"}}><Icon name="trash" size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Items - Grid View ── */}
      {viewMode==="grid"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)"}}>No items found</div>}
          {filtered.map(item=>{
            const ss = STATUS_STYLES[item.status]||STATUS_STYLES.available;
            const icon = typeIcon(item);
            return (
              <div key={item._id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden",transition:"transform 0.2s,border-color 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor="rgba(212,133,10,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}}>
                {item.image
                  ? <img src={item.image} alt="" style={{width:"100%",height:120,objectFit:"cover"}}/>
                  : <div style={{width:"100%",height:120,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{icon}</div>
                }
                <div style={{padding:"14px 14px 10px"}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:13,color:"#f0c060",fontWeight:700}}>{item.pricePerDay>0?`₹${item.pricePerDay.toLocaleString()}/d`:"—"}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color}}>{ss.label}</span>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>startEdit(item)} style={{flex:1,background:"rgba(212,133,10,0.12)",border:"1px solid rgba(212,133,10,0.25)",color:"#f0c060",padding:"5px 0",borderRadius:7,cursor:"pointer",fontSize:11}}>Edit</button>
                    <button onClick={()=>del(item._id)} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.15)",color:"#ff6b6b",padding:"5px 8px",borderRadius:7,cursor:"pointer"}}><Icon name="trash" size={12}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  // Vehicles
  { value:"vehicle_service",     label:"🔧 Vehicle Service / Repair",    group:"🛵 Vehicles" },
  { value:"vehicle_fuel",        label:"⛽ Fuel",                         group:"🛵 Vehicles" },
  { value:"vehicle_insurance",   label:"🛡️ Vehicle Insurance",           group:"🛵 Vehicles" },
  { value:"vehicle_registration",label:"📋 RC / Registration / Tax",      group:"🛵 Vehicles" },
  { value:"vehicle_purchase",    label:"🛒 Vehicle Purchase",             group:"🛵 Vehicles" },
  { value:"vehicle_tyres",       label:"🔵 Tyres / Tubes",                group:"🛵 Vehicles" },
  { value:"vehicle_cleaning",    label:"🧽 Vehicle Cleaning / Detailing", group:"🛵 Vehicles" },
  // Villa & Property
  { value:"villa_civil",         label:"🏗️ Civil / Construction Work",   group:"🏡 Villa & Property" },
  { value:"villa_electrical",    label:"⚡ Electrical Repairs",           group:"🏡 Villa & Property" },
  { value:"villa_plumbing",      label:"🚿 Plumbing Repairs",             group:"🏡 Villa & Property" },
  { value:"villa_furniture",     label:"🪑 Furniture / Fixtures",         group:"🏡 Villa & Property" },
  { value:"villa_housekeeping",  label:"🧹 Housekeeping / Cleaning",      group:"🏡 Villa & Property" },
  { value:"villa_amenities",     label:"🏊 Amenities Upkeep",             group:"🏡 Villa & Property" },
  { value:"villa_rent",          label:"🏠 Property Rent / Lease",        group:"🏡 Villa & Property" },
  // Staff
  { value:"staff_salary",        label:"👷 Staff Salaries",               group:"👥 Staff" },
  { value:"staff_commission",    label:"💸 Driver / Guide Commission",    group:"👥 Staff" },
  { value:"staff_bonus",         label:"🎁 Bonus / Incentive",            group:"👥 Staff" },
  { value:"staff_travel",        label:"🚌 Staff Travel / Conveyance",    group:"👥 Staff" },
  // Office & Ops
  { value:"office_rent",         label:"🏢 Office Rent",                  group:"🏢 Office & Ops" },
  { value:"utilities",           label:"💡 Electricity / Water / Gas",    group:"🏢 Office & Ops" },
  { value:"internet_phone",      label:"📡 Internet / Phone Bills",       group:"🏢 Office & Ops" },
  { value:"supplies",            label:"📦 Office / Cleaning Supplies",   group:"🏢 Office & Ops" },
  { value:"software",            label:"💻 Software / Subscriptions",     group:"🏢 Office & Ops" },
  // Marketing
  { value:"marketing_ads",       label:"📢 Online Ads / Promotions",      group:"📣 Marketing" },
  { value:"marketing_print",     label:"🖨️ Printing / Banners",          group:"📣 Marketing" },
  { value:"marketing_gifts",     label:"🎀 Customer Gifts / Hampers",     group:"📣 Marketing" },
  // Tours & Hotel
  { value:"hotel_stay",          label:"🏨 Hotel Stay (for tours)",       group:"🗺️ Tours & Hotel" },
  { value:"meal_expense",        label:"🍽️ Meals / Refreshments",        group:"🗺️ Tours & Hotel" },
  { value:"entry_tickets",       label:"🎟️ Entry Tickets / Permits",     group:"🗺️ Tours & Hotel" },
  { value:"toll_parking",        label:"🛣️ Toll / Parking",              group:"🗺️ Tours & Hotel" },
  // Finance
  { value:"bank_charges",        label:"🏦 Bank / Payment Charges",       group:"💳 Finance" },
  { value:"tax_govt",            label:"🧾 GST / Tax / Govt Fees",        group:"💳 Finance" },
  { value:"loan_emi",            label:"📅 Loan EMI / Interest",          group:"💳 Finance" },
  // Other
  { value:"other_expense",       label:"➖ Other Expense",                group:"📂 Other" },
];

// Asset types — tag every expense to a specific asset
const EXPENSE_ASSETS = [
  { value:"",        label:"— No specific asset —" },
  { value:"villa",   label:"🏡 Villa" },
  { value:"scooty",  label:"🛵 Scooty / Activa" },
  { value:"bike",    label:"🏍️ Bike" },
  { value:"car",     label:"🚗 Car" },
  { value:"bus",     label:"🚌 Bus / Tempo Traveller" },
  { value:"hotel",   label:"🏨 Hotel / Property" },
  { value:"office",  label:"🏢 Office" },
  { value:"general", label:"🏛️ General / Agency" },
];

const PAYMENT_METHODS = ["cash","upi","bank_transfer","card","cheque","other"];

// Tiny SVG donut chart
function DonutChart({ segments, size=90 }) {
  const total = segments.reduce((s,d)=>s+d.value,0)||1;
  let offset=0;
  const r=36, cx=50, cy=50, circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"/>
      {segments.filter(s=>s.value>0).map((seg,i)=>{
        const pct=seg.value/total;
        const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="14"
          strokeDasharray={`${pct*circ} ${circ}`} strokeDashoffset={-offset*circ}
          transform="rotate(-90 50 50)"/>;
        offset+=pct; return el;
      })}
    </svg>
  );
}

function AccountingEditor({ data, api, reload, showSaved }) {
  const accData = data.accounting || { transactions:[], summary:{ totalIncome:0, totalExpense:0, netProfit:0, breakdown:{} } };
  const allTx   = accData.transactions || [];

  // Date filter state
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const today = now.toISOString().slice(0,10);

  const [datePreset, setDatePreset] = useState("month");
  const [dateFrom, setDateFrom]   = useState(firstOfMonth);
  const [dateTo, setDateTo]       = useState(today);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [sortDir, setSortDir]     = useState("desc");

  const blankForm = { type:"income", category:"vehicle_rental", amount:"", date:today, description:"", clientName:"", agencyName:"", paymentStatus:"paid", paymentMethod:"cash", notes:"", vendorName:"", assetTag:"", assetName:"", receiptUrl:"" };
  const [form, setForm] = useState({...blankForm});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const allCats = [...INCOME_CATEGORIES,...EXPENSE_CATEGORIES];
  const categoryLabel = (cat) => allCats.find(c=>c.value===cat)?.label || cat;
  const categoryGroup = (cat) => allCats.find(c=>c.value===cat)?.group || "";
  const expenseGroups = EXPENSE_CATEGORIES.reduce((acc,c)=>{ if(!acc[c.group])acc[c.group]=[]; acc[c.group].push(c); return acc; },{});
  const fmt = (n) => `₹${Number(n||0).toLocaleString("en-IN")}`;

  // Preset date ranges
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const n = new Date();
    if (preset==="today")    { const d=n.toISOString().slice(0,10); setDateFrom(d); setDateTo(d); }
    if (preset==="week")     { const d=new Date(n-6*864e5).toISOString().slice(0,10); setDateFrom(d); setDateTo(n.toISOString().slice(0,10)); }
    if (preset==="month")    { setDateFrom(new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10)); setDateTo(n.toISOString().slice(0,10)); }
    if (preset==="quarter")  { setDateFrom(new Date(n.getFullYear(),Math.floor(n.getMonth()/3)*3,1).toISOString().slice(0,10)); setDateTo(n.toISOString().slice(0,10)); }
    if (preset==="year")     { setDateFrom(`${n.getFullYear()}-01-01`); setDateTo(`${n.getFullYear()}-12-31`); }
    if (preset==="all")      { setDateFrom("2020-01-01"); setDateTo("2099-12-31"); }
  };

  // Filtered transactions
  const filtered = allTx.filter(tx => {
    const d = tx.date ? tx.date.slice(0,10) : "";
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    if (filterCat==="income"  && tx.type!=="income")  return false;
    if (filterCat==="expense" && tx.type!=="expense") return false;
    if (filterCat==="pending" && tx.paymentStatus!=="pending") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!((tx.description||"").toLowerCase().includes(q)||(tx.clientName||"").toLowerCase().includes(q)||(tx.agencyName||"").toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a,b)=>{
    const da=a.date||"",db=b.date||"";
    return sortDir==="desc"?db.localeCompare(da):da.localeCompare(db);
  });

  // Summary for filtered range
  const filteredIncome  = filtered.filter(t=>t.type==="income" && t.paymentStatus!=="pending").reduce((s,t)=>s+t.amount,0);
  const filteredExpense = filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const filteredProfit  = filteredIncome - filteredExpense;
  const pendingAmt      = filtered.filter(t=>t.paymentStatus==="pending").reduce((s,t)=>s+t.amount,0);

  // Revenue breakdown for donut
  const breakdown = {};
  filtered.filter(t=>t.type==="income" && t.paymentStatus!=="pending").forEach(t=>{ breakdown[t.category]=(breakdown[t.category]||0)+t.amount; });
  const donutColors = ["#f0c060","#4ade80","#60a5fa","#a78bfa","#fb923c","#f472b6"];
  const donutSegments = Object.entries(breakdown).map(([cat,val],i)=>({ label:categoryLabel(cat), value:val, color:donutColors[i%donutColors.length] }));

  // Monthly trend for filtered year (last 6 months)
  const monthlyData = (() => {
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const label=d.toLocaleString("en-IN",{month:"short"});
      const inc=allTx.filter(t=>t.type==="income"&&t.paymentStatus!=="pending"&&(t.date||"").startsWith(ym)).reduce((s,t)=>s+t.amount,0);
      const exp=allTx.filter(t=>t.type==="expense"&&(t.date||"").startsWith(ym)).reduce((s,t)=>s+t.amount,0);
      months.push({label,inc,exp});
    }
    return months;
  })();
  const maxBar = Math.max(...monthlyData.map(m=>Math.max(m.inc,m.exp)),1);

  // Form handlers
  const startAdd = (type="income") => {
    setForm({...blankForm, type, category: type==="income"?"vehicle_rental":"maintenance", date:today});
    setEditId(null); setShowForm(true);
  };
  const startEdit = (tx) => {
    setForm({...tx, amount:String(tx.amount), date:tx.date?tx.date.slice(0,10):today});
    setEditId(tx._id); setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditId(null); setForm({...blankForm}); };
  const save = async () => {
    if (!form.amount||isNaN(Number(form.amount))||Number(form.amount)<=0){alert("Enter a valid amount.");return;}
    const payload={...form,amount:Number(form.amount)};
    if(editId) await api.put(`/accounting/${editId}`,payload);
    else       await api.post("/accounting",payload);
    cancel(); showSaved("✅ Changes saved!"); await reload();
  };
  const del = async (id) => {
    if(!window.confirm("Delete this transaction?"))return;
    await api.delete(`/accounting/${id}`); await reload(); showSaved("🗑️ Entry deleted","delete");
  };

  // CSV export
  const exportCSV = () => {
    const rows=[["Date","Type","Category","Amount","Client","Agency","Payment Method","Payment Status","Description"]];
    filtered.forEach(t=>rows.push([t.date,t.type,t.category,t.amount,t.clientName,t.agencyName,t.paymentMethod,t.paymentStatus,t.description]));
    const csv=rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="accounting.csv";a.click();
  };

  const profitColor = filteredProfit>=0?"#4ade80":"#ff6b6b";

  return (
    <div>
      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:30,marginBottom:4}}>Accounting</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",letterSpacing:1}}>{allTx.length} total transactions · All time</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={exportCSV} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.6)",padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>↓ Export CSV</button>
          <button onClick={()=>startAdd("income")} style={{background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80",padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Income</button>
          <button onClick={()=>startAdd("expense")} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",color:"#ff6b6b",padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Expense</button>
          <button onClick={async()=>{ if(!window.confirm("Remove accounting entries linked to deleted bookings?")) return; const r=await api.delete("/bookings?cleanup=accounting"); alert(r.message||"Done"); await reload(); }} style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.1)",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>Clean Orphaned</button>
        </div>
      </div>

      {/* ── Date Range Filter ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Date range</div>
        {/* Presets */}
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[["today","Today"],["week","Last 7d"],["month","This Month"],["quarter","This Quarter"],["year","This Year"],["all","All Time"]].map(([p,l])=>(
            <button key={p} onClick={()=>applyPreset(p)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${datePreset===p?"#d4850a":"rgba(255,255,255,0.1)"}`,background:datePreset===p?"rgba(212,133,10,0.2)":"transparent",color:datePreset===p?"#f0c060":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:datePreset===p?600:400,transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>
        {/* Custom date pickers */}
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>From</span>
            <input type="date" className="adm-input" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setDatePreset("custom");}} style={{width:"auto"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>To</span>
            <input type="date" className="adm-input" value={dateTo} onChange={e=>{setDateTo(e.target.value);setDatePreset("custom");}} style={{width:"auto"}}/>
          </div>
          <div style={{flex:1,minWidth:160,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:0.4}}>🔍</span>
            <input className="adm-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search client, description…" style={{paddingLeft:34}}/>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
        {[
          {label:"Income",    value:fmt(filteredIncome),  color:"#4ade80", sub:`${filtered.filter(t=>t.type==="income").length} entries`},
          {label:"Expenses",  value:fmt(filteredExpense), color:"#ff6b6b", sub:`${filtered.filter(t=>t.type==="expense").length} entries`},
          {label:"Net Profit",value:fmt(filteredProfit),  color:profitColor, sub: filteredProfit>=0?"Positive ✅":"Negative ⚠️"},
          {label:"Pending",   value:fmt(pendingAmt),      color:"#f0c060", sub:`${filtered.filter(t=>t.paymentStatus==="pending").length} unpaid`},
        ].map(s=>(
          <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:"'Playfair Display'",marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      {allTx.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {/* Monthly trend */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 20px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>6-month trend</div>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:72}}>
              {monthlyData.map((m,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:60}}>
                    <div title={`Income: ₹${m.inc.toLocaleString("en-IN")}`} style={{flex:1,background:"rgba(74,222,128,0.5)",borderRadius:"3px 3px 0 0",height:`${Math.max(2,(m.inc/maxBar)*100)}%`}}/>
                    <div title={`Expense: ₹${m.exp.toLocaleString("en-IN")}`} style={{flex:1,background:"rgba(255,100,100,0.5)",borderRadius:"3px 3px 0 0",height:`${Math.max(2,(m.exp/maxBar)*100)}%`}}/>
                  </div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase"}}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:12,marginTop:8}}>
              {[["rgba(74,222,128,0.7)","Income"],["rgba(255,100,100,0.7)","Expense"]].map(([c,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"rgba(255,255,255,0.35)"}}>
                  <div style={{width:8,height:8,borderRadius:2,background:c}}/>{l}
                </div>
              ))}
            </div>
          </div>

          {/* Revenue breakdown donut */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 20px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Income by category</div>
            {donutSegments.length===0
              ? <div style={{color:"rgba(255,255,255,0.2)",fontSize:12,paddingTop:20}}>No income in range</div>
              : (
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <DonutChart segments={donutSegments} size={88}/>
                  <div style={{flex:1,display:"grid",gap:6}}>
                    {donutSegments.map((s,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{s.label.split(" ").slice(1).join(" ")}</span>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,color:s.color}}>{fmt(s.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      {showForm&&(
        <div style={{background:"rgba(212,133,10,0.04)",border:"1px solid rgba(212,133,10,0.35)",borderRadius:14,padding:"20px 24px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h3 style={{color:"#f0c060",fontSize:18}}>{editId?"✏️ Edit Transaction":form.type==="income"?"➕ New Income":"➖ New Expense"}</h3>
            <button onClick={cancel} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
          {/* Type toggle */}
          {!editId&&(
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[["income","✅ Income","#4ade80"],["expense","❌ Expense","#ff6b6b"]].map(([t,l,c])=>(
                <button key={t} onClick={()=>{set("type",t);set("category",t==="income"?"vehicle_rental":"maintenance");}}
                  style={{padding:"8px 20px",borderRadius:8,border:`2px solid ${form.type===t?c:"rgba(255,255,255,0.1)"}`,background:form.type===t?`rgba(${t==="income"?"74,222,128":"255,100,100"},0.1)`:"transparent",color:form.type===t?c:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontWeight:600}}>
                  {l}
                </button>
              ))}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            {/* Category — grouped dropdown for expenses */}
            <div>
              <label className="adm-label">Category</label>
              {form.type==="expense" ? (
                <select className="adm-input" value={form.category} onChange={e=>set("category",e.target.value)}>
                  {Object.entries(expenseGroups).map(([group,cats])=>(
                    <optgroup key={group} label={group}>
                      {cats.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <select className="adm-input" value={form.category} onChange={e=>set("category",e.target.value)}>
                  {INCOME_CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )}
            </div>
            <div><label className="adm-label">Amount (₹) *</label><input className="adm-input" type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="5000"/></div>
            <div><label className="adm-label">Date</label><input className="adm-input" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
            {/* Expense: Vendor | Income: Client */}
            {form.type==="expense" ? (
              <div><label className="adm-label">Vendor / Paid To</label><input className="adm-input" value={form.vendorName||""} onChange={e=>set("vendorName",e.target.value)} placeholder="e.g. Raju Garage, Sharma Electricals"/></div>
            ) : (
              <div><label className="adm-label">Client name</label><input className="adm-input" value={form.clientName||""} onChange={e=>set("clientName",e.target.value)} placeholder="Priya Sharma"/></div>
            )}
            {/* Expense: Asset tag */}
            {form.type==="expense" && (
              <div>
                <label className="adm-label">Asset / Property</label>
                <select className="adm-input" value={form.assetTag||""} onChange={e=>set("assetTag",e.target.value)}>
                  {EXPENSE_ASSETS.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            )}
            {form.type==="expense" && form.assetTag && (
              <div><label className="adm-label">Asset Name / Number</label><input className="adm-input" value={form.assetName||""} onChange={e=>set("assetName",e.target.value)} placeholder="e.g. Activa RJ14AB1234, Villa Room 2"/></div>
            )}
            {form.type==="income" && form.category==="agency_commission" && (
              <div><label className="adm-label">Agency name</label><input className="adm-input" value={form.agencyName||""} onChange={e=>set("agencyName",e.target.value)} placeholder="Make My Trip"/></div>
            )}
            {form.type==="income" && form.category!=="agency_commission" && (
              <div style={{display:"none"}}/>
            )}
            <div>
              <label className="adm-label">Payment method</label>
              <select className="adm-input" value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}>
                {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-label">Payment status</label>
              <select className="adm-input" value={form.paymentStatus} onChange={e=>set("paymentStatus",e.target.value)}>
                <option value="paid">✅ Paid</option>
                <option value="pending">⏳ Pending</option>
                <option value="partial">🔶 Partial</option>
              </select>
            </div>
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Description</label><input className="adm-input" value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder={form.type==="expense"?"e.g. Engine oil + filter change — Activa RJ14AB1234":"e.g. Honda Activa rental — 3 days"}/></div>
            {/* Receipt upload — expenses only */}
            {form.type==="expense" && (
              <div style={{gridColumn:"1 / -1"}}>
                <label className="adm-label">Receipt / Bill Photo (optional)</label>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <input className="adm-input" value={form.receiptUrl||""} onChange={e=>set("receiptUrl",e.target.value)} placeholder="Paste URL or upload" style={{flex:1}}/>
                  <label style={{background:"rgba(212,133,10,0.15)",border:"1px solid rgba(212,133,10,0.4)",color:"#f0c060",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
                    <Icon name="upload" size={14}/> Upload
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                      const file=e.target.files[0]; if(!file) return;
                      try { const r=await api.upload(file); if(r.url) set("receiptUrl",r.url); } catch(err){alert("Upload failed");}
                    }}/>
                  </label>
                </div>
                {form.receiptUrl && (
                  <a href={form.receiptUrl} target="_blank" rel="noreferrer">
                    <img src={form.receiptUrl} alt="Receipt" style={{marginTop:8,height:80,objectFit:"cover",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer"}} onError={e=>e.target.style.display="none"}/>
                  </a>
                )}
              </div>
            )}
            <div style={{gridColumn:"1 / -1"}}><label className="adm-label">Notes (internal)</label><textarea className="adm-input" value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder={form.type==="expense"?"Work done, warranty, next service due…":"Additional notes…"}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"10px 28px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Save Transaction</button>
            <button onClick={cancel} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"10px 20px",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Asset-wise Expense Breakdown (shown when Expenses tab is active) ── */}
      {filterCat==="expense" && filtered.length>0 && (() => {
        const byAsset = {};
        filtered.forEach(tx => {
          const key = tx.assetTag || "general";
          if (!byAsset[key]) byAsset[key] = 0;
          byAsset[key] += tx.amount;
        });
        const assetTotal = Object.values(byAsset).reduce((s,v)=>s+v,0)||1;
        return (
          <div style={{background:"rgba(255,100,100,0.04)",border:"1px solid rgba(255,100,100,0.15)",borderRadius:12,padding:"16px 20px",marginBottom:16}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Expense breakdown by asset · {fmt(assetTotal)} total</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
              {Object.entries(byAsset).sort((a,b)=>b[1]-a[1]).map(([key,val])=>{
                const asset = EXPENSE_ASSETS.find(a=>a.value===key);
                const pct = Math.round((val/assetTotal)*100);
                return (
                  <div key={key} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:6}}>{asset?.label||"🏛️ General"}</div>
                    <div style={{fontSize:17,fontWeight:700,color:"#ff6b6b",marginBottom:6}}>₹{val.toLocaleString("en-IN")}</div>
                    <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"rgba(255,100,100,0.55)",borderRadius:4}}/>
                    </div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:4}}>{pct}% of period</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Ledger Filter Bar ── */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["all","All",allTx.length],["income","Income",allTx.filter(t=>t.type==="income").length],["expense","Expenses",allTx.filter(t=>t.type==="expense").length],["pending","Pending",allTx.filter(t=>t.paymentStatus==="pending").length]].map(([val,lbl,cnt])=>(
            <button key={val} onClick={()=>setFilterCat(val)} style={{padding:"6px 14px",borderRadius:16,border:`1px solid ${filterCat===val?"#d4850a":"rgba(255,255,255,0.1)"}`,background:filterCat===val?"rgba(212,133,10,0.15)":"transparent",color:filterCat===val?"#f0c060":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:12,fontWeight:filterCat===val?600:400}}>
              {lbl} ({cnt})
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Showing {filtered.length} entries</span>
          <button onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:11}}>
            Date {sortDir==="desc"?"↓":"↑"}
          </button>
        </div>
      </div>

      {/* ── Transaction Ledger ── */}
      <div style={{display:"grid",gap:8}}>
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)"}}>
            <div style={{fontSize:40,marginBottom:12}}>💳</div>
            <div style={{fontSize:14}}>{allTx.length===0?"No transactions yet — add your first entry above":"No results for this date range / filter"}</div>
          </div>
        )}
        {filtered.map(tx=>{
          const isIncome = tx.type==="income";
          const paidColor = tx.paymentStatus==="paid"?"#4ade80":tx.paymentStatus==="pending"?"#f0c060":"#fb923c";
          return (
            <div key={tx._id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 18px",display:"flex",gap:14,alignItems:"center",borderLeft:`3px solid ${isIncome?"#4ade80":"#ff6b6b"}`,borderRadius:"0 14px 14px 0",transition:"border-color 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}>
              <div style={{width:42,height:42,borderRadius:10,background:isIncome?"rgba(74,222,128,0.1)":"rgba(255,100,100,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {isIncome?"📥":"📤"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                  <span style={{fontWeight:600,fontSize:14}}>{tx.description||categoryLabel(tx.category)}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5}}>{categoryLabel(tx.category)}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"transparent",border:`1px solid ${paidColor}33`,color:paidColor}}>{tx.paymentStatus}</span>
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",display:"flex",gap:10,flexWrap:"wrap"}}>
                  {tx.vendorName&&<span>🏪 {tx.vendorName}</span>}
                  {tx.clientName&&<span>👤 {tx.clientName}</span>}
                  {tx.agencyName&&<span>🤝 {tx.agencyName}</span>}
                  {tx.assetTag&&<span style={{color:"rgba(212,133,10,0.8)"}}>{EXPENSE_ASSETS.find(a=>a.value===tx.assetTag)?.label||tx.assetTag}{tx.assetName?` · ${tx.assetName}`:""}</span>}
                  {tx.paymentMethod&&<span>{tx.paymentMethod.replace(/_/g," ")}</span>}
                  <span>{tx.date?new Date(tx.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):""}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {tx.receiptUrl && (
                  <a href={tx.receiptUrl} target="_blank" rel="noreferrer" title="View receipt/bill">
                    <img src={tx.receiptUrl} alt="receipt" style={{width:38,height:38,objectFit:"cover",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",display:"block",marginBottom:4,marginLeft:"auto"}} onError={e=>e.target.style.display="none"}/>
                  </a>
                )}
                <div style={{fontSize:18,fontWeight:700,color:isIncome?"#4ade80":"#ff6b6b",fontFamily:"'Playfair Display'"}}>{isIncome?"+":"-"}{fmt(tx.amount)}</div>
                {!isIncome && categoryGroup(tx.category) && (
                  <div style={{fontSize:9,color:"rgba(212,133,10,0.55)",marginTop:2,letterSpacing:0.5}}>{categoryGroup(tx.category)}</div>
                )}
                <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
                  <button onClick={()=>startEdit(tx)} style={{background:"rgba(212,133,10,0.12)",border:"1px solid rgba(212,133,10,0.25)",color:"#f0c060",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Edit</button>
                  <button onClick={()=>del(tx._id)} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.15)",color:"#ff6b6b",padding:"4px 8px",borderRadius:6,cursor:"pointer"}}><Icon name="trash" size={12}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── QR Pay Step (extracted from IIFE for babel compat) ──────────────────────
function QRPayStep({ total, setStep }) {
  const advance  = total > 0 ? Math.ceil(total * 0.5) : 0;
  const upiId    = "vinay.purbia-2@oksbi";
  const upiName  = "Travel Engineers";
  const upiLink  = "upi://pay?pa=" + upiId + "&pn=" + encodeURIComponent(upiName) + "&am=" + advance + "&cu=INR&tn=" + encodeURIComponent("Vehicle booking advance");
  const qrUrl    = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(upiLink) + "&bgcolor=ffffff";
  return (
    <div style={{padding:"28px 24px",textAlign:"center"}}>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Step 2 of 2</div>
      <div style={{fontFamily:"'Playfair Display'",fontSize:22,color:"white",marginBottom:4}}>Scan & Pay 50% Now</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Remaining 50% paid at vehicle pickup</div>
      <div style={{background:"rgba(212,133,10,0.08)",border:"1px solid rgba(212,133,10,0.2)",borderRadius:12,padding:"16px",display:"flex",justifyContent:"space-around",marginBottom:20}}>
        <div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4}}>TOTAL</div><div style={{fontSize:16,fontWeight:700,color:"white"}}>&#8377;{total.toLocaleString("en-IN")}</div></div>
        <div style={{borderLeft:"1px solid rgba(255,255,255,0.08)",borderRight:"1px solid rgba(255,255,255,0.08)",padding:"0 20px"}}><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4}}>PAY NOW</div><div style={{fontSize:16,fontWeight:700,color:"#f0c060"}}>&#8377;{advance.toLocaleString("en-IN")}</div></div>
        <div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4}}>AT PICKUP</div><div style={{fontSize:16,fontWeight:700,color:"#4ade80"}}>&#8377;{(total-advance).toLocaleString("en-IN")}</div></div>
      </div>
      <div style={{display:"inline-block",background:"white",borderRadius:16,padding:12,marginBottom:16,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
        <img src={qrUrl} alt="UPI QR Code" width={200} height={200} style={{display:"block",borderRadius:8}}/>
      </div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:6}}>UPI ID: <span style={{color:"#f0c060",fontWeight:600}}>vinay.purbia-2@oksbi</span></div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:20}}>Works with GPay, PhonePe, Paytm and all UPI apps</div>
      <a href={upiLink} style={{display:"block",marginBottom:12}}>
        <button style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#1a8f3c,#25d366)",color:"white",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>
          Open UPI App to Pay &#8377;{advance.toLocaleString("en-IN")}
        </button>
      </a>
      <button onClick={()=>setStep("success")} style={{width:"100%",padding:"11px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",borderRadius:12,cursor:"pointer",fontSize:13}}>
        I have paid - Continue
      </button>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:10}}>Screenshot your payment as confirmation</div>
    </div>
  );
}

// ─── Booking Modal (public site) ─────────────────────────────────────────────
function BookingModal({ vehicle, whatsapp, api, onClose }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({ customerName:"", phone:"", checkIn:today, checkOut:"", stayAddress:"", notes:"" });
  const [step, setStep] = useState("form"); // form | qr | success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [bookingId, setBookingId] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const days = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 864e5))
    : 0;
  const priceNum = vehicle.price ? Number(String(vehicle.price).replace(/[^0-9]/g,"")) : 0;
  const total = priceNum * days;

  const buildWaUrl = () => {
    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
    const d = days || "?";

    const msg = [
      "🛵 *New Booking Request!*",
      "",
      `*Vehicle:* ${vehicle.name}`,
      `*Customer:* ${form.customerName}`,
      `*Phone:* ${form.phone}`,
      `*Check-in:* ${fmt(form.checkIn)}`,
      `*Check-out:* ${fmt(form.checkOut)}`,
      `*Duration:* ${d} day${d!==1?"s":""}`,
      `*Stay Address:* ${form.stayAddress||"—"}`,
      form.notes ? `*Notes:* ${form.notes}` : null,
    ].filter(Boolean).join("\n");
    const num = (whatsapp||"").replace(/[^0-9]/g,"");
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  const submit = async () => {
    if (!form.customerName.trim()) { setError("Please enter your name."); return; }
    if (!form.phone.trim() || form.phone.length < 7) { setError("Please enter a valid phone number."); return; }
    if (!form.checkIn) { setError("Please select a check-in date."); return; }
    if (!form.checkOut) { setError("Please select a check-out date."); return; }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) { setError("Check-out must be after check-in."); return; }
    if (!form.stayAddress.trim()) { setError("Please enter your hotel or stay address."); return; }
    setError("");
    setLoading(true);
    // Open WhatsApp BEFORE the await - browsers block window.open after async calls
    const waWin = window.open(buildWaUrl(), "_blank");
    try {
      const result = await api.post("/bookings", { ...form, vehicleName: vehicle.name, vehicleId: vehicle._id, pricePerDay: vehicle.priceNum || 0 });
      // Update the already-open window with the server URL if available
      if (result?.whatsappUrl && waWin && !waWin.closed) {
        waWin.location.href = result.whatsappUrl;
      }
      setBookingId(result?.booking?._id || "");
      setStep("success"); // Show thank you message - payment request comes from admin



    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      {/* Backdrop */}
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={onClose}/>
      {/* Modal */}
      <div style={{position:"relative",background:"#0d1b2e",border:"1px solid rgba(240,192,96,0.2)",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        {/* Header */}
        <div style={{padding:"22px 24px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:14,alignItems:"center"}}>
          {vehicle.image && <img src={vehicle.image} alt="" style={{width:56,height:56,objectFit:"cover",borderRadius:10,flexShrink:0}}/>}
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Playfair Display'",fontSize:20,fontWeight:700,color:"white"}}>{vehicle.name}</div>
            <div style={{fontSize:13,color:"#f0c060",fontWeight:600,marginTop:2}}>
              {vehicle.price && `₹${vehicle.price}`}<span style={{color:"rgba(255,255,255,0.3)",fontWeight:400}}>{vehicle.period||"/day"}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        </div>

        {step==="success" ? (
          <div style={{padding:"40px 24px",textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:16}}>🎉</div>
            <div style={{fontFamily:"'Playfair Display'",fontSize:24,color:"#f0c060",marginBottom:12}}>Thank You for Your Booking!</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.8,marginBottom:12}}>
              Your booking request for <strong style={{color:"white"}}>{vehicle.name}</strong> has been successfully received.
            </div>
            <div style={{background:"rgba(240,192,96,0.08)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"left"}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.9}}>
                📋 <strong style={{color:"#f0c060"}}>What happens next?</strong><br/>
                Our team will review your request and get back to you shortly on WhatsApp with confirmation and further details.<br/><br/>
                📞 For any queries, feel free to contact us directly on <strong style={{color:"white"}}>{whatsapp||"our registered number"}</strong>.
              </div>
            </div>
            <button onClick={onClose} style={{background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"13px 36px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14}}>Close</button>
          </div>
        ) : step==="qr" ? (
          <QRPayStep total={total} setStep={setStep} />
        ) : (
          <div style={{padding:"20px 24px 24px"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Booking details</div>

            {/* reusable field styles */}
            {(()=>{
              const fi = {width:"100%",padding:"10px 14px",background:"#0d1b2e",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#ffffff",fontFamily:"'DM Sans'",fontSize:14,outline:"none",boxSizing:"border-box",colorScheme:"dark"};
              const fiSel = {...fi,appearance:"none",WebkitAppearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:32};
              const lbl2 = {display:"block",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:2,marginBottom:6};
              return (
                <div style={{display:"grid",gap:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={lbl2}>Your name *</label>
                      <input value={form.customerName} onChange={e=>set("customerName",e.target.value)} placeholder="Full name" style={fi}/>
                    </div>
                    <div>
                      <label style={lbl2}>Phone (WhatsApp) *</label>
                      <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+965 / +91 with country code" type="tel" style={fi}/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={lbl2}>Check-in *</label>
                      <input type="date" value={form.checkIn} min={today} onChange={e=>set("checkIn",e.target.value)} style={fi}/>
                    </div>
                    <div>
                      <label style={lbl2}>Check-out *</label>
                      <input type="date" value={form.checkOut} min={form.checkIn||today} onChange={e=>set("checkOut",e.target.value)} style={fi}/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={lbl2}>Nationality</label>
                      <select value={["Indian","Kuwaiti","Saudi","Emirati","Bahraini","Qatari","Omani","British","American","German","French","Australian","Canadian","Russian","Chinese","Japanese","Filipino","Pakistani","Bangladeshi","Nepali","Sri Lankan",""].includes(form.nationality||"")?(form.nationality||""):"__other__"} onChange={e=>set("nationality",e.target.value==="__other__"?"":e.target.value)} style={fiSel}>
                        <option value="">Select nationality…</option>
                        {["Indian","Kuwaiti","Saudi","Emirati","Bahraini","Qatari","Omani","British","American","German","French","Australian","Canadian","Russian","Chinese","Japanese","Filipino","Pakistani","Bangladeshi","Nepali","Sri Lankan"].map(n=><option key={n} value={n}>{n}</option>)}
                        <option value="__other__">Other (type below)</option>
                      </select>
                      {!["Indian","Kuwaiti","Saudi","Emirati","Bahraini","Qatari","Omani","British","American","German","French","Australian","Canadian","Russian","Chinese","Japanese","Filipino","Pakistani","Bangladeshi","Nepali","Sri Lankan",""].includes(form.nationality||"") && (
                        <input value={form.nationality||""} onChange={e=>set("nationality",e.target.value)} placeholder="Type your nationality…" style={{...fi,marginTop:6}}/>
                      )}
                    </div>
                    <div>
                      <label style={lbl2}>ID Type</label>
                      <select value={["passport","driving_license","national_id","civil_id","voter_id",""].includes(form.idType||"")?(form.idType||""):"__other__"} onChange={e=>set("idType",e.target.value==="__other__"?"":e.target.value)} style={fiSel}>
                        <option value="">Select ID type…</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving Licence</option>
                        <option value="national_id">National ID / Aadhar</option>
                        <option value="civil_id">Civil ID (Kuwait)</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="__other__">Other (type below)</option>
                      </select>
                      {!["passport","driving_license","national_id","civil_id","voter_id",""].includes(form.idType||"") && (
                        <input value={form.idType||""} onChange={e=>set("idType",e.target.value)} placeholder="Describe your ID…" style={{...fi,marginTop:6}}/>
                      )}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={lbl2}>Purpose of Visit</label>
                      <select value={["tourism","honeymoon","family_trip","business","wedding","adventure",""].includes(form.purpose||"")?(form.purpose||""):"__other__"} onChange={e=>set("purpose",e.target.value==="__other__"?"":e.target.value)} style={fiSel}>
                        <option value="">Select purpose…</option>
                        <option value="tourism">Tourism / Sightseeing</option>
                        <option value="honeymoon">Honeymoon</option>
                        <option value="family_trip">Family Trip</option>
                        <option value="business">Business</option>
                        <option value="wedding">Wedding / Event</option>
                        <option value="adventure">Adventure / Trek</option>
                        <option value="__other__">Other (type below)</option>
                      </select>
                      {!["tourism","honeymoon","family_trip","business","wedding","adventure",""].includes(form.purpose||"") && (
                        <input value={form.purpose||""} onChange={e=>set("purpose",e.target.value)} placeholder="Describe your purpose…" style={{...fi,marginTop:6}}/>
                      )}
                    </div>
                    <div>
                      <label style={lbl2}>Hotel / Stay area *</label>
                      <input value={form.stayAddress} onChange={e=>set("stayAddress",e.target.value)} placeholder="Hotel name, area" style={fi}/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl2}>Notes (optional)</label>
                    <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any special requests…" rows={2}
                      style={{...fi,resize:"vertical"}}/>
                  </div>
                </div>
              );
            })()}

            {/* Price summary */}
            {days>0&&priceNum>0&&(
              <div style={{margin:"16px 0",background:"rgba(212,133,10,0.08)",border:"1px solid rgba(212,133,10,0.2)",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>₹{priceNum.toLocaleString("en-IN")} × {days} day{days!==1?"s":""}</span>
                <span style={{fontSize:18,fontWeight:700,color:"#f0c060",fontFamily:"'Playfair Display'"}}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            )}

            {error&&<div style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.25)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#ff6b6b",marginBottom:12}}>{error}</div>}

            <button onClick={submit} disabled={loading}
              style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",borderRadius:10,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading ? "Sending…" : "📲 Confirm Booking → WhatsApp"}
            </button>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",textAlign:"center",marginTop:8}}>
              Owner will confirm via WhatsApp within a few hours
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MigrationButton — reusable base for fix_sources + regen_accounting ──────
function MigrationButton({ label, runningLabel, doneLabel, title, onRun, onDone, confirmMsg }) {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);

  const run = async () => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setState("running");
    try {
      const res = await onRun();
      setResult(res);
      setState("done");
      setTimeout(() => { setState("idle"); setResult(null); if (onDone) onDone(); }, 4000);
    } catch(e) {
      setResult({ message: e.message });
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const cfg = {
    idle:    { label,         bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.5)" },
    running: { label:runningLabel||"⏳ Running…", bg:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.3)" },
    done:    { label:doneLabel||"✅ Done!",        bg:"rgba(74,222,128,0.1)",   border:"rgba(74,222,128,0.3)",   color:"#4ade80" },
    error:   { label:"❌ Failed",                  bg:"rgba(255,100,100,0.1)",  border:"rgba(255,100,100,0.3)",  color:"#ff6b6b" },
  }[state];

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
      <button onClick={run} disabled={state==="running"} title={title}
        style={{padding:"10px 16px",background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:10,color:cfg.color,fontWeight:600,fontSize:13,cursor:state==="running"?"not-allowed":"pointer",whiteSpace:"nowrap",transition:"all 0.3s"}}>
        {cfg.label}
      </button>
      {result?.message && (
        <div style={{fontSize:11,color:state==="error"?"#ff6b6b":"rgba(255,255,255,0.4)",textAlign:"right",maxWidth:240,lineHeight:1.4}}>
          {result.message}
        </div>
      )}
    </div>
  );
}

// ── FixSourcesButton ──────────────────────────────────────────────────────────
function FixSourcesButton({ api, onDone }) {
  return (
    <MigrationButton
      label="🔧 Fix Sources"
      title="Stamp source:walkin/online on all existing bookings"
      confirmMsg={"Scan all bookings and stamp source:walkin or source:online\nbased on phone, name, notes and status patterns.\n\nAlready-tagged bookings are skipped. Safe to run multiple times.\n\nContinue?"}
      onRun={() => api.post("/bookings?fix_sources=true", {})}
      onDone={onDone}
    />
  );
}

// ── RegenAccountingButton ─────────────────────────────────────────────────────
function RegenAccountingButton({ api, onDone }) {
  return (
    <MigrationButton
      label="📒 Regen Accounting"
      title="Create missing accounting entries for all walk-in bookings"
      confirmMsg={"Create accounting entries for all walk-in bookings that don't have one yet.\n\nBookings already in accounting are skipped.\nBookings with no price data are skipped.\n\nRun AFTER Fix Sources.\n\nContinue?"}
      onRun={() => api.post("/bookings?regen_accounting=true", {})}
      onDone={onDone}
    />
  );
}

// ─── EditBookingModal ────────────────────────────────────────────────────────
// Lets admin edit vehicle, dates, price, address, notes on any booking
function EditBookingModal({ booking, rentals, api, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0,10);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const allRentals = rentals||[];
  const available  = allRentals.filter(r=>r.available);
  // Current booking's vehicle — may be unavailable, still show it
  const currentVehicle = booking.vehicleId
    ? allRentals.find(r=>r._id===booking.vehicleId) : null;

  const [form, setForm] = useState({
    customerName: booking.customerName||"",
    phone:        booking.phone||"",
    email:        booking.email||"",
    vehicleId:    booking.vehicleId||"",
    vehicleName:  booking.vehicleName||"",
    checkIn:      booking.checkIn  ? booking.checkIn.slice(0,10)  : "",
    checkOut:     booking.checkOut ? booking.checkOut.slice(0,10) : "",
    pricePerDay:  booking.pricePerDay||"",
    stayAddress:  booking.stayAddress||"",
    notes:        booking.notes||"",
    paymentMethod: booking.paymentMethod||"cash",
    source: booking.source||"online",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Derived from form so it updates live when the user toggles Source
  const isWalkin = form.source === "walkin";

  const days = form.checkIn&&form.checkOut
    ? Math.max(0,Math.round((new Date(form.checkOut)-new Date(form.checkIn))/864e5)) : 0;
  const ppd   = Number(form.pricePerDay)||0;
  const total = ppd*days;

  const selectVehicle = (vid) => {
    if (!vid) { set("vehicleId",""); set("vehicleName",""); return; }
    if (vid==="__custom__") { set("vehicleId","__custom__"); set("vehicleName",""); return; }
    const r = allRentals.find(r=>r._id===vid);
    if (r) {
      const price = r.price ? Number(String(r.price).replace(/[^0-9.]/g,"")) : 0;
      setForm(f=>({...f, vehicleId:vid, vehicleName:r.name, pricePerDay: price||f.pricePerDay }));
    }
  };

  const save = async () => {
    if (!form.customerName.trim()) { setError("Customer name required."); return; }
    if (!form.vehicleName.trim())  { setError("Vehicle is required."); return; }
    if (!form.checkIn)             { setError("Check-in date required."); return; }
    if (!form.checkOut)            { setError("Check-out date required."); return; }
    if (new Date(form.checkOut)<=new Date(form.checkIn)) { setError("Check-out must be after check-in."); return; }
    setError(""); setSaving(true);
    try {
      await api.put(`/bookings?id=${booking._id}`, {
        ...booking,
        customerName:  form.customerName,
        phone:         form.phone,
        email:         form.email||null,
        vehicleId:     form.vehicleId==="__custom__"?"":form.vehicleId,
        vehicleName:   form.vehicleName,
        checkIn:       form.checkIn,
        checkOut:      form.checkOut,
        pricePerDay:   ppd||null,
        stayAddress:   form.stayAddress||null,
        notes:         form.notes||null,
        paymentMethod: form.paymentMethod||null,
        source:        form.source||"online",
      });
      await onSaved();
    } catch(e) { setError(e.message||"Save failed."); }
    setSaving(false);
  };

  const fi  = {width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:8,color:"white",fontFamily:"'DM Sans'",fontSize:14,outline:"none",boxSizing:"border-box"};
  const fiS = {...fi,cursor:"pointer",appearance:"none",WebkitAppearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:32};
  const lb  = {display:"block",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:2,marginBottom:6};

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"#0d1b2e",border:"1px solid rgba(212,133,10,0.3)",borderRadius:20,width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
        {/* Header */}
        <div style={{padding:"18px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0d1b2e",zIndex:10}}>
          <div>
            <div style={{fontFamily:"'Playfair Display'",fontSize:18,fontWeight:700,color:"#f0c060"}}>✏️ Edit Booking</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{booking.customerName} · {booking.vehicleName||"—"}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.4)",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{padding:"22px 24px 28px",display:"flex",flexDirection:"column",gap:16}}>
          <style>{`.te-dark-sel-edit option,.te-dark-sel-edit optgroup{background:#0d1b2e!important;color:#fff!important;}`}</style>

          {/* Customer */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><label style={lb}>Customer Name *</label><input style={fi} value={form.customerName} onChange={e=>set("customerName",e.target.value)}/></div>
            <div><label style={lb}>Phone *</label><input style={fi} value={form.phone} onChange={e=>set("phone",e.target.value)} type="tel"/></div>
            <div><label style={lb}>Email</label><input style={fi} value={form.email} onChange={e=>set("email",e.target.value)} type="email" placeholder="Optional"/></div>
          </div>

          {/* Vehicle */}
          <div>
            <label style={lb}>Vehicle *</label>
            <select className="te-dark-sel-edit" style={fiS} value={form.vehicleId||""} onChange={e=>selectVehicle(e.target.value)}>
              <option value="">— Select vehicle —</option>
              {/* Current vehicle first if it's not in available list */}
              {currentVehicle && !currentVehicle.available && (
                <option key={currentVehicle._id} value={currentVehicle._id}>{currentVehicle.name} (currently unavailable)</option>
              )}
              {available.map(r=><option key={r._id} value={r._id}>{r.name}{r.vehicleNo?` #${r.vehicleNo}`:""} — {r.price}{r.period||""}</option>)}
              <option value="__custom__">Other (type manually)</option>
            </select>
          </div>
          {(form.vehicleId==="__custom__") && (
            <div><label style={lb}>Vehicle Name (manual)</label><input style={fi} value={form.vehicleName} onChange={e=>set("vehicleName",e.target.value)} placeholder="e.g. Honda Activa, Innova Crysta"/></div>
          )}
          {/* Always show current vehicle name as read-only hint below the select */}
          {form.vehicleName && form.vehicleId !== "__custom__" && (
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:-8}}>Selected: <span style={{color:"#f0c060"}}>{form.vehicleName}</span></div>
          )}

          {/* Dates + price */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={lb}>Check-in *</label><input type="date" style={{...fi,colorScheme:"dark"}} value={form.checkIn} onChange={e=>set("checkIn",e.target.value)}/></div>
            <div><label style={lb}>Check-out *</label><input type="date" style={{...fi,colorScheme:"dark"}} value={form.checkOut} min={form.checkIn||""} onChange={e=>set("checkOut",e.target.value)}/></div>
            <div><label style={lb}>Price per Day (₹)</label><input type="number" style={fi} value={form.pricePerDay} onChange={e=>set("pricePerDay",e.target.value)} placeholder="0"/></div>
            <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              {days>0&&ppd>0&&(
                <div style={{background:"rgba(212,133,10,0.08)",border:"1px solid rgba(212,133,10,0.2)",borderRadius:8,padding:"10px 14px"}}>
                  <span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{days}d × ₹{ppd.toLocaleString("en-IN")} = </span>
                  <span style={{color:"#f0c060",fontWeight:700,fontSize:17}}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address + Notes */}
          <div><label style={lb}>Hotel / Stay Address</label><input style={fi} value={form.stayAddress} onChange={e=>set("stayAddress",e.target.value)} placeholder="Hotel name, area"/></div>
          <div><label style={lb}>Notes</label><textarea rows={2} style={{...fi,resize:"vertical",lineHeight:1.6}} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>

          {/* Source toggle */}
          <div>
            <label style={lb}>Booking Source</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {val:"online", icon:"🌐", label:"Online",   desc:"Customer booked via website"},
                {val:"walkin", icon:"🏪", label:"Walk-in",  desc:"In-person / admin entry"},
              ].map(opt=>(
                <button key={opt.val} type="button" onClick={()=>set("source",opt.val)}
                  style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${form.source===opt.val?(opt.val==="walkin"?"rgba(74,222,128,0.5)":"rgba(96,165,250,0.5)"):"rgba(255,255,255,0.1)"}`,
                    background:form.source===opt.val?(opt.val==="walkin"?"rgba(74,222,128,0.08)":"rgba(96,165,250,0.08)"):"rgba(255,255,255,0.03)",
                    cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}>
                  <div style={{fontSize:16,marginBottom:2}}>{opt.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:form.source===opt.val?(opt.val==="walkin"?"#4ade80":"#60a5fa"):"rgba(255,255,255,0.5)"}}>{opt.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method — walk-in only */}
          {isWalkin && (
            <div>
              <label style={lb}>Payment Method</label>
              <select className="te-dark-sel-edit" style={fiS} value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="card">💳 Card</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="other">💰 Other</option>
              </select>
            </div>
          )}

          {error&&<div style={{padding:"10px 14px",borderRadius:8,background:"rgba(255,100,100,0.08)",border:"1px solid rgba(255,100,100,0.2)",color:"#ff6b6b",fontSize:13}}>❌ {error}</div>}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"rgba(255,255,255,0.5)",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Cancel</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:"12px",background:"linear-gradient(135deg,#d4850a,#f0c060)",border:"none",borderRadius:10,color:"#1a1a2e",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1,fontFamily:"'DM Sans'"}}>
              {saving?"Saving…":"💾 Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bookings Editor (admin tab) ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:           { color:"#f0c060", bg:"rgba(240,192,96,0.12)",  border:"rgba(240,192,96,0.3)",  label:"⏳ Pending",            dot:"#f0c060" },
  payment_requested: { color:"#fb923c", bg:"rgba(251,146,60,0.12)",  border:"rgba(251,146,60,0.3)",  label:"💳 Payment Requested",  dot:"#fb923c" },
  confirmed:         { color:"#4ade80", bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.3)",  label:"✅ Confirmed",           dot:"#4ade80" },
  completed:         { color:"#60a5fa", bg:"rgba(96,165,250,0.12)",  border:"rgba(96,165,250,0.3)",  label:"🏁 Completed",          dot:"#60a5fa" },
  cancelled:         { color:"#ff6b6b", bg:"rgba(255,107,107,0.12)", border:"rgba(255,107,107,0.3)", label:"❌ Cancelled",           dot:"#ff6b6b" },
};

function BookingsEditor({ data, api, reload, rentals=[] }) {
  const bookings = data.bookings || [];
  // Look up pricePerDay from the rentals list using vehicleId
  const getPricePerDay = (b) => {
    if (b.pricePerDay > 0) return b.pricePerDay;
    const rental = rentals.find(r => r._id === b.vehicleId);
    return rental ? (Number(rental.price) || 0) : 0;
  };
  const [filter, setFilter]   = useState("all");
  const [sourceTab, setSourceTab] = useState("all"); // all | online | walkin
  const [search, setSearch]   = useState("");
  const [sortDir, setSortDir] = useState("desc");

  // Detect walk-in by source field OR legacy name/phone pattern
  const isWalkin = (b) =>
    b.source === "walkin" ||
    (b.customerName || "").toLowerCase() === "walk-in customer" ||
    (b.phone || "").replace(/[^0-9]/g,"") === "0000000000";
  const [expanded, setExpanded] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [recordPaymentModal, setRecordPaymentModal] = useState(null); // { booking, suggestedAmount }
  const [showManualModal, setShowManualModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null); // booking being edited

  // Auto-refresh every 20 seconds so new bookings appear without page reload
  useEffect(() => {
    const interval = setInterval(() => reload(), 20000);
    return () => clearInterval(interval);
  }, []);

  // Auto-complete bookings whose check-out date has passed (throttled)
  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const stale = bookings.filter(b =>
      (b.status === "confirmed" || b.status === "payment_requested") &&
      b.checkOut && new Date(b.checkOut) < today
    );
    if (stale.length === 0) return;
    const runBatch = async () => {
      const batch = stale.slice(0, 5);
      await Promise.all(batch.map(b => api.put(`/bookings?id=${b._id}`, { status: "completed" })));
      if (stale.length > 5) setTimeout(() => reload(), 2000);
      else reload();
    };
    runBatch();
  }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
  const days = (b) => (b.checkIn&&b.checkOut) ? Math.max(1,Math.round((new Date(b.checkOut)-new Date(b.checkIn))/864e5)) : null;

  // Strip everything except digits - customer must type their full number with country code
  const formatPhoneForWA = (raw) => (raw || "").replace(/[^0-9]/g, "");

  // Counts
  const counts = { all:bookings.length, pending:0, payment_requested:0, confirmed:0, completed:0, cancelled:0 };
  bookings.forEach(b=>{ if(counts[b.status]!==undefined) counts[b.status]++; });

  const onlineCountReal = bookings.filter(b => !isWalkin(b)).length;
  const walkinCountReal = bookings.filter(b => isWalkin(b)).length;

  // Filter + search + sort
  let filtered = bookings;
  if (sourceTab === "online") filtered = filtered.filter(b => !isWalkin(b));
  if (sourceTab === "walkin") filtered = filtered.filter(b => isWalkin(b));
  if (sourceTab === "online" && filter !== "all") filtered = filtered.filter(b=>b.status===filter);
  else if (sourceTab !== "online" && filter !== "all") filtered = filtered.filter(b=>b.status===filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b=>(b.customerName||"").toLowerCase().includes(q)||(b.phone||"").toLowerCase().includes(q)||(b.vehicleName||"").toLowerCase().includes(q)||(b.stayAddress||"").toLowerCase().includes(q));
  }
  filtered = [...filtered].sort((a,b)=>{
    const da=a.createdAt||"", db=b.createdAt||"";
    return sortDir==="desc"?new Date(db)-new Date(da):new Date(da)-new Date(db);
  });

  // Sync inventory status when booking status changes
  const syncInventory = async (booking, newStatus) => {
    if (!booking.vehicleId) return;
    try {
      // Find the inventory item linked to this rental
      const invItems = data.inventory?.items || data.inventory || [];
      const invItem = invItems.find(i => i.linkedRentalId === booking.vehicleId || String(i.linkedRentalId) === String(booking.vehicleId));
      if (!invItem) return;
      if (newStatus === "confirmed") {
        // Mark inventory as booked, add booking dates
        await api.put(`/inventory/${invItem._id}`, {
          ...invItem,
          status: "booked",
          bookedDates: [...(invItem.bookedDates||[]), {
            from: booking.checkIn,
            to: booking.checkOut,
            clientName: booking.customerName,
            bookingRef: String(booking._id),
          }],
        });
      } else if (newStatus === "completed" || newStatus === "cancelled") {
        // Mark inventory as available again, remove this booking's dates
        const remaining = (invItem.bookedDates||[]).filter(d => d.bookingRef !== String(booking._id));
        await api.put(`/inventory/${invItem._id}`, { ...invItem, status: "available", bookedDates: remaining });
      }
    } catch(e) { console.error("Inventory sync failed:", e); }
  };

  const updateStatus = async (id, status, booking=null) => {
    // For payment_requested: show modal BEFORE saving, so amount is set first
    if (status === "payment_requested" && booking) {
      const d = (booking.checkIn && booking.checkOut)
        ? Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 864e5))
        : 1;
      const pricePerDay = getPricePerDay(booking);
      const total = pricePerDay * d;
      // Pre-fill with 50% of total if price known, otherwise use previously saved tokenAmount
      const suggested = total > 0 ? Math.round(total * 0.5) : (booking.tokenAmount > 0 ? booking.tokenAmount : "");
      setPaymentModal({ booking, suggestedAmount: suggested, total, days: d });
      return; // Don't save status yet - modal will handle it
    }
    await api.put(`/bookings?id=${id}`, { status });
    if (booking) await syncInventory(booking, status);
    await reload();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    await api.delete(`/bookings?id=${id}`); await reload(); showSaved("🗑️ Booking deleted","delete");
  };

  // Builds UPI payment link for exact 50% advance amount
  const buildUpiLink = (b) => {
    const priceMatch = getPricePerDay(b) || b.amount || 0;
    const d = (b.checkIn && b.checkOut) ? Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5)) : 1;
    const total = priceMatch * d;
    const advance = Math.round(total * 0.5);
    if (advance <= 0) return null;
    // UPI deep link - works with all UPI apps
    const upiUrl = `upi://pay?pa=vinay.purbia-2@oksbi&pn=Travel+Engineers&am=${advance}&cu=INR&tn=Advance+for+${encodeURIComponent(b.vehicleName||"booking")}`;
    return { upiUrl, advance, total, remaining: total - advance, days: d };
  };

  const openPaymentWhatsApp = (b, tokenAmount) => {
    const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
    const d = (b.checkIn && b.checkOut) ? Math.max(1,Math.round((new Date(b.checkOut)-new Date(b.checkIn))/864e5)) : 1;
    const advance = Number(tokenAmount) || 0;
    const upiUrl = advance > 0
      ? `upi://pay?pa=vinay.purbia-2@oksbi&pn=Travel+Engineers&am=${advance}&cu=INR&tn=Advance+for+${encodeURIComponent(b.vehicleName||"booking")}`
      : null;
    const payPageUrl = advance > 0
      ? `${window.location.origin}/pay?amount=${advance}&upi=vinay.purbia-2%40oksbi&name=${encodeURIComponent(b.vehicleName||"booking")}&customer=${encodeURIComponent(b.customerName)}`
      : null;
    const msg = [
      `✅ *Booking Confirmed — Travel Engineers*`,
      ``,
      `Hi ${b.customerName}! Your booking is confirmed 🎉`,
      ``,
      `🛵 *Vehicle:* ${b.vehicleName||"—"}`,
      `📅 *Dates:* ${fmt2(b.checkIn)} → ${fmt2(b.checkOut)} (${d} day${d!==1?"s":""})`,
      `📍 *Delivery to:* ${b.stayAddress||"—"}`,
      ``,
      `💰 *Payment Request:*`,
      advance > 0 ? `*Token amount to pay now: ₹${advance}*` : null,
      `Remaining balance to be paid at pickup`,
      ``,
      payPageUrl ? `👇 *Tap to open payment QR code:*` : null,
      payPageUrl ? payPageUrl : null,
      ``,
      `Or pay directly via UPI ID: *vinay.purbia-2@oksbi*`,
      advance > 0 ? `Amount: ₹${advance}` : null,
      ``,
      `Thank you! See you soon 🙏`,
      `— Travel Engineers`,
    ].filter(Boolean).join("\n");
    const num = formatPhoneForWA(b.phone);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  const openWhatsApp = (b) => {
    // Simple message to customer (not payment request - just chat)
    const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
    const msg = [`Hi ${b.customerName}! This is Travel Engineers regarding your booking for *${b.vehicleName||"vehicle"}* (${fmt2(b.checkIn)} → ${fmt2(b.checkOut)}). How can I help you?`].join("");
    const num = formatPhoneForWA(b.phone);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:30,marginBottom:4}}>Bookings</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",letterSpacing:1}}>{bookings.length} total · {counts.pending} pending action</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start"}}>
          <button onClick={()=>setShowManualModal(true)}
            style={{padding:"10px 20px",background:"linear-gradient(135deg,#d4850a,#f0c060)",border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
            🏪 Walk-in Booking
          </button>
          <FixSourcesButton api={api} onDone={reload} />
          <RegenAccountingButton api={api} onDone={reload} />
        </div>
      </div>

      {/* Source Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"rgba(255,255,255,0.03)",padding:6,borderRadius:14,border:"1px solid rgba(255,255,255,0.07)"}}>
        {[
          {id:"all",    icon:"📋", label:"All Bookings", count:bookings.length,  color:"#f0c060"},
          {id:"online", icon:"🌐", label:"Online",        count:onlineCountReal,  color:"#60a5fa"},
          {id:"walkin", icon:"🏪", label:"Walk-in",       count:walkinCountReal,  color:"#4ade80"},
        ].map(t=>(
          <button key={t.id} onClick={()=>{ setSourceTab(t.id); setFilter("all"); }}
            style={{flex:1,padding:"12px 8px",borderRadius:10,border:"none",background:sourceTab===t.id?"rgba(255,255,255,0.08)":"transparent",cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:sourceTab===t.id?t.color:"rgba(255,255,255,0.4)",fontFamily:"'DM Sans'"}}>{t.label}</span>
            <span style={{fontSize:18,fontWeight:800,color:sourceTab===t.id?t.color:"rgba(255,255,255,0.25)",fontFamily:"'Playfair Display'"}}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Status filter pills */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {[
          {val:"all",               label:"All"},
          {val:"pending",           label:"⏳ Pending"},
          {val:"payment_requested", label:"💳 Payment Req"},
          {val:"confirmed",         label:"✅ Confirmed"},
          {val:"completed",         label:"🏁 Completed"},
          {val:"cancelled",         label:"❌ Cancelled"},
        ].map(s=>(
          <button key={s.val} onClick={()=>setFilter(s.val)}
            style={{padding:"6px 14px",borderRadius:16,border:`1px solid ${filter===s.val?"#d4850a":"rgba(255,255,255,0.1)"}`,background:filter===s.val?"rgba(212,133,10,0.15)":"transparent",color:filter===s.val?"#f0c060":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:12,fontWeight:filter===s.val?600:400,fontFamily:"'DM Sans'"}}>
            {s.label} ({s.val==="all"?filtered.length:counts[s.val]??0})
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:0.4,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, vehicle…"
            style={{width:"100%",boxSizing:"border-box",paddingLeft:36,paddingRight:14,paddingTop:9,paddingBottom:9,background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:8,color:"white",fontFamily:"'DM Sans'",fontSize:13,outline:"none"}}/>
        </div>
        <button onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")}
          style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",fontFamily:"'DM Sans'"}}>
          Date {sortDir==="desc"?"↓":"↑"}
        </button>
      </div>

      {/* Bookings List */}
      <div style={{display:"grid",gap:10}}>
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)"}}>
            <div style={{fontSize:40,marginBottom:12}}>📋</div>
            <div style={{fontSize:14}}>{bookings.length===0?"No bookings yet — they'll appear here when customers book":"No results for this filter"}</div>
          </div>
        )}
        {filtered.map(b=>{
          const sc = STATUS_CONFIG[b.status]||STATUS_CONFIG.pending;
          const d  = days(b);
          const isExpanded = expanded===b._id;
          return (
            <div key={b._id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden",transition:"border-color 0.2s",borderLeft:`3px solid ${sc.dot}`}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=sc.border}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}>
              {/* Main row */}
              <div style={{padding:"14px 18px",display:"flex",gap:14,alignItems:"center",cursor:"pointer"}} onClick={()=>setExpanded(isExpanded?null:b._id)}>
                <div style={{width:44,height:44,borderRadius:10,background:sc.bg,border:`1px solid ${sc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {b.status==="pending"?"⏳":b.status==="confirmed"?"✅":b.status==="completed"?"🏁":"❌"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontWeight:700,fontSize:15}}>{b.customerName}</span>
                    <span style={{fontSize:11,padding:"2px 9px",borderRadius:10,background:sc.bg,border:`1px solid ${sc.border}`,color:sc.color}}>{sc.label}</span>
                    {b.vehicleName&&<span style={{fontSize:11,background:"rgba(255,255,255,0.06)",padding:"2px 8px",borderRadius:10,color:"rgba(255,255,255,0.4)"}}>🛵 {b.vehicleName}</span>}
                    {isWalkin(b)&&<span style={{fontSize:10,background:"rgba(212,133,10,0.15)",padding:"2px 8px",borderRadius:10,color:"#f0c060",border:"1px solid rgba(212,133,10,0.3)"}}>🏪 Walk-in</span>}
                    {!isWalkin(b)&&<span style={{fontSize:10,background:"rgba(96,165,250,0.1)",padding:"2px 8px",borderRadius:10,color:"#60a5fa",border:"1px solid rgba(96,165,250,0.2)"}}>🌐 Online</span>}
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span>📞 {b.phone}</span>
                    {b.checkIn&&<span>📅 {fmt(b.checkIn)} → {fmt(b.checkOut)}{d?` (${d}d)`:""}</span>}
                    {b.stayAddress&&<span style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {b.stayAddress}</span>}
                    <span style={{color:"rgba(255,255,255,0.2)"}}>{b.createdAt?new Date(b.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                  <button onClick={e=>{e.stopPropagation();openWhatsApp(b);}} title="Message customer on WhatsApp"
                    style={{background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.3)",color:"#25d366",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:13}}>💬</button>
                  {b.status==="payment_requested"&&(
                    <button
                      onClick={e=>{
                        e.stopPropagation();
                        const d = (b.checkIn && b.checkOut) ? Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 864e5)) : 1;
                        const pricePerDay = getPricePerDay(b);
                        const total = pricePerDay * d;
                        // Pre-fill with previously saved tokenAmount, or 50% of total, or blank
                        const suggested = b.tokenAmount > 0 ? b.tokenAmount : (total > 0 ? Math.round(total * 0.5) : "");
                        setPaymentModal({ booking: b, suggestedAmount: suggested, total, days: d });
                      }}
                      title="Resend payment request to customer"
                      style={{background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.4)",color:"#fb923c",padding:"6px 11px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                      🔁 Resend
                    </button>
                  )}
                  <select value={b.status} onChange={e=>{e.stopPropagation();updateStatus(b._id,e.target.value,b);}}
                    onClick={e=>e.stopPropagation()}
                    style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${sc.border}`,background:"#0d1b2e",color:sc.color,fontSize:11,cursor:"pointer",fontWeight:600,outline:"none",appearance:"none",WebkitAppearance:"none",paddingRight:24,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 6px center"}}>
                    <option value="pending" style={{background:"#0d1b2e",color:"white"}}>⏳ Pending</option>
                    <option value="payment_requested" style={{background:"#0d1b2e",color:"white"}}>💳 Request Payment</option>
                    <option value="confirmed" style={{background:"#0d1b2e",color:"white"}}>✅ Confirmed</option>
                    <option value="completed" style={{background:"#0d1b2e",color:"white"}}>🏁 Completed</option>
                    <option value="cancelled" style={{background:"#0d1b2e",color:"white"}}>❌ Cancelled</option>
                  </select>
                  <button onClick={e=>{e.stopPropagation();setEditBooking(b);}} title="Edit booking details"
                    style={{background:"rgba(212,133,10,0.1)",border:"1px solid rgba(212,133,10,0.3)",color:"#f0c060",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>✏️ Edit</button>
                  <button onClick={e=>{e.stopPropagation();del(b._id);}} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.15)",color:"#ff6b6b",padding:"6px 10px",borderRadius:7,cursor:"pointer"}}>🗑</button>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.2)",userSelect:"none"}}>{isExpanded?"▲":"▼"}</span>
                </div>
              </div>
              {/* Expanded details */}
              {isExpanded&&(
                <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"14px 18px",background:"rgba(0,0,0,0.15)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    ["Customer", b.customerName],
                    ["Phone", b.phone],
                    ["Vehicle", b.vehicleName||"—"],
                    ["Check-in", fmt(b.checkIn)],
                    ["Check-out", fmt(b.checkOut)],
                    ["Duration", d?`${d} day${d!==1?"s":""}` :"—"],
                    ["Stay Address", b.stayAddress||"—"],
                    ["Booked on", b.createdAt?new Date(b.createdAt).toLocaleString("en-IN"):"—"],
                    ["Source", isWalkin(b)?"🏪 Walk-in (Admin)":"🌐 Online"],
                  ].map(([l,v])=>(
                    <div key={l}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{l}</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.8)"}}>{v}</div>
                    </div>
                  ))}
                  {b.notes&&(
                    <div style={{gridColumn:"1/-1"}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>Notes</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.8)"}}>{b.notes}</div>
                    </div>
                  )}
                  {/* Payment summary — walk-in shows cash/method summary; online shows token flow */}
                  {(() => {
                    const bDays2 = (b.checkIn&&b.checkOut)?Math.max(1,Math.round((new Date(b.checkOut)-new Date(b.checkIn))/864e5)):1;
                    const ppd2   = getPricePerDay(b);
                    const total2 = ppd2>0 ? ppd2*bDays2 : 0;
                    const recv2  = b.receivedAmount||0;
                    const remain2 = total2>0 ? Math.max(0,total2-recv2) : 0;
                    // If no pricePerDay set: recv>0 means paid, recv=0 means unpaid (can't calc partial)
                    const payStatus = recv2===0
                      ? "unpaid"
                      : total2===0
                        ? "paid"                          // received something, no price set — assume paid
                        : recv2>=total2 ? "paid" : "partial";
                    const payStatusCfg = {
                      unpaid:  { label:"💸 Unpaid",       color:"#ff6b6b", bg:"rgba(255,107,107,0.12)", border:"rgba(255,107,107,0.3)" },
                      partial: { label:"🔶 Partly Paid",  color:"#f0c060", bg:"rgba(240,192,96,0.12)",  border:"rgba(240,192,96,0.3)"  },
                      paid:    { label:"✅ Fully Paid",   color:"#4ade80", bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.3)"  },
                    }[payStatus];
                    const methodLabel = { cash:"💵 Cash", upi:"📱 UPI", card:"💳 Card", bank_transfer:"🏦 Bank Transfer", other:"💰 Other" };
                    if (isWalkin(b) && (total2>0||recv2>0)) return (
                      <div style={{gridColumn:"1/-1",background:"rgba(212,133,10,0.05)",border:"1px solid rgba(212,133,10,0.18)",borderRadius:10,padding:"14px 16px"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>💰 Walk-in Payment</div>
                        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
                          {total2>0
                            ? <div><div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:3}}>Total</div><div style={{fontSize:18,fontWeight:800,color:"#f0c060",fontFamily:"'Playfair Display'"}}>₹{total2.toLocaleString("en-IN")}</div></div>
                            : <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic",alignSelf:"center"}}>No price set — <button onClick={()=>setEditBooking(b)} style={{background:"none",border:"none",color:"#f0c060",cursor:"pointer",fontSize:12,padding:0,textDecoration:"underline"}}>Edit booking</button> to add price/day</div>
                          }
                          {recv2>0&&<div><div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:3}}>Received</div><div style={{fontSize:18,fontWeight:800,color:"#4ade80",fontFamily:"'Playfair Display'"}}>₹{recv2.toLocaleString("en-IN")}</div></div>}
                          {remain2>0&&<div><div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:3}}>Remaining</div><div style={{fontSize:18,fontWeight:800,color:"#ff6b6b",fontFamily:"'Playfair Display'"}}>₹{remain2.toLocaleString("en-IN")}</div></div>}
                          <div style={{display:"flex",flexDirection:"column",gap:6,marginLeft:"auto"}}>
                            <span style={{fontSize:12,padding:"4px 12px",borderRadius:20,background:payStatusCfg.bg,border:`1px solid ${payStatusCfg.border}`,color:payStatusCfg.color,fontWeight:700}}>{payStatusCfg.label}</span>
                            {b.paymentMethod&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",textAlign:"center"}}>{methodLabel[b.paymentMethod]||b.paymentMethod}</span>}
                          </div>
                        </div>
                      </div>
                    );
                    if (!isWalkin(b) && (b.payOnArrival||b.tokenAmount>0||recv2>0)) return (
                      <div style={{gridColumn:"1/-1",background:"rgba(240,192,96,0.06)",border:"1px solid rgba(240,192,96,0.15)",borderRadius:10,padding:"12px 16px"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Payment Summary</div>
                        {b.payOnArrival ? (
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:13,padding:"4px 12px",borderRadius:20,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.35)",color:"#a5b4fc",fontWeight:600}}>🤝 Pay on Arrival</span>
                            <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Full amount due at pickup / delivery</span>
                          </div>
                        ) : (<BookingPaySummary b={b} getPricePerDay={getPricePerDay} />)}
                      </div>
                    );
                    return null;
                  })()}
                  {/* ── Customer ID Panel — scan/view customer ID ── */}
                  <CustomerIdPanel booking={b} onUpdated={() => reload()} />
                  {/* Record / Edit Payment button */}
                  {(()=>{
                    const bppd   = getPricePerDay(b);
                    const bdays  = (b.checkIn&&b.checkOut)?Math.max(1,Math.round((new Date(b.checkOut)-new Date(b.checkIn))/864e5)):1;
                    const btotal = bppd*bdays;
                    const brecv  = b.receivedAmount||0;
                    // Only walk-in bookings get the "Edit Payment" treatment when fully paid
                    // Online bookings always show the green Record Payment button (their token flow is unchanged)
                    const walkin = isWalkin(b);
                    // Fully paid if: total is set and received >= total
                    // OR: no price set but some amount was received (legacy imports with no pricePerDay)
                    const fullyPaid = walkin && (
                      (btotal>0 && brecv>=btotal) ||
                      (btotal===0 && brecv>0)
                    );
                    const btnLabel = fullyPaid ? "✏️ Edit Payment" : "💰 Record Received Payment";
                    const btnStyle = fullyPaid
                      ? {background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)"}
                      : {background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80"};
                    return (
                      <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>setRecordPaymentModal(b)}
                          style={{...btnStyle,padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
                          {btnLabel}
                        </button>
                        {fullyPaid&&<span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Payment complete — click to correct if needed</span>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Payment Token Modal ── */}
      {paymentModal&&(
        <PaymentTokenModal
          booking={paymentModal.booking}
          suggestedAmount={paymentModal.suggestedAmount}
          total={paymentModal.total}
          days={paymentModal.days}
          onSend={async (amount)=>{
            // Save status + token amount to DB
            await api.put(`/bookings?id=${paymentModal.booking._id}`, { status:"payment_requested", tokenAmount: Number(amount) });
            await reload();
            openPaymentWhatsApp(paymentModal.booking, amount);
            setPaymentModal(null);
          }}
          onApproveArrival={async ()=>{
            // Approve pay-on-arrival - confirm booking and send WhatsApp
            await api.put(`/bookings?id=${paymentModal.booking._id}`, { status:"confirmed", payOnArrival: true, tokenAmount: 0, receivedAmount: 0 });
            await syncInventory(paymentModal.booking, "confirmed");
            await reload();
            const b = paymentModal.booking;
            const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
            const msg = [
              `✅ *Booking Confirmed — Travel Engineers*`,
              ``,
              `Hi ${b.customerName}! Your booking is confirmed 🎉`,
              ``,
              `🛵 *Vehicle:* ${b.vehicleName||"—"}`,
              `📅 *Dates:* ${fmt2(b.checkIn)} → ${fmt2(b.checkOut)}`,
              `📍 *Delivery to:* ${b.stayAddress||"—"}`,
              ``,
              `💰 *Payment:* Full amount to be paid at the time of vehicle pickup/delivery.`,
              ``,
              `Thank you! See you soon 🙏`,
              `— Travel Engineers`,
            ].filter(Boolean).join("\n");
            const num = (b.phone||"").replace(/[^0-9]/g,"");
            window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
            setPaymentModal(null);
          }}
          onClose={()=>setPaymentModal(null)}
        />
      )}

      {/* ── Record Payment Modal ── */}
      {recordPaymentModal&&(
        <RecordPaymentModal
          booking={recordPaymentModal}
          totalAmount={getPricePerDay(recordPaymentModal) * ((recordPaymentModal.checkIn && recordPaymentModal.checkOut) ? Math.max(1, Math.round((new Date(recordPaymentModal.checkOut) - new Date(recordPaymentModal.checkIn)) / 864e5)) : 1)}
          onSave={async(received, totalAmt)=>{
            // 1. Update booking receivedAmount
            const bid = String(recordPaymentModal._id||"");
            const days_ = (recordPaymentModal.checkIn&&recordPaymentModal.checkOut)?Math.max(1,Math.round((new Date(recordPaymentModal.checkOut)-new Date(recordPaymentModal.checkIn))/864e5)):1;
            const orderTotal = totalAmt || (getPricePerDay(recordPaymentModal)*days_) || (recordPaymentModal.tokenAmount*2) || 0;
            const prevReceived = recordPaymentModal.receivedAmount||0;
            // `received` is the NEW TOTAL received (not an addition) — user sees and edits the cumulative figure
            const newReceived = Number(received);
            const addedNow    = Math.max(0, newReceived - prevReceived); // how much was added this session
            const newStatus   = newReceived >= orderTotal && orderTotal>0 ? "completed" : newReceived>0 ? "confirmed" : recordPaymentModal.status;
            await api.put(`/bookings?id=${bid}`, { receivedAmount: newReceived, status: newStatus });
            if (newStatus === "confirmed"||newStatus==="completed") await syncInventory(recordPaymentModal, newStatus);
            // 2. Auto-create accounting entry only for the NEW amount added this session
            const balanceRemaining = Math.max(0, orderTotal - newReceived);
            try {
              if (addedNow > 0) {
                await api.post("/accounting", {
                  type: "income",
                  category: "vehicle_rental",
                  amount: addedNow,
                  description: `${prevReceived>0?"Balance payment":"Payment"} — ${recordPaymentModal.vehicleName||"vehicle"} / ${recordPaymentModal.customerName}`,
                  clientName: recordPaymentModal.customerName,
                  linkedBookingId: bid,
                  paymentStatus: balanceRemaining > 0 ? "partial" : "paid",
                  paymentMethod: recordPaymentModal.paymentMethod||"cash",
                  date: new Date().toISOString(),
                  notes: `Order total: ₹${orderTotal} | Paid so far: ₹${newReceived} | Remaining: ₹${balanceRemaining}`,
                });
              }
            } catch(e) { console.error("Accounting sync failed:", e); }
            await reload();
            setRecordPaymentModal(null);
          }}
          onClose={()=>setRecordPaymentModal(null)}
        />
      )}

      {/* ── Edit Booking Modal ── */}
      {editBooking && (
        <EditBookingModal
          booking={editBooking}
          rentals={data.rentals||rentals||[]}
          api={api}
          onClose={()=>setEditBooking(null)}
          onSaved={async()=>{ setEditBooking(null); await reload(); }}
        />
      )}

      {/* Walk-in / Manual Booking Modal */}
      {showManualModal && (
        <ManualBookingModal
          rentals={data.rentals || rentals || []}
          onClose={()=>setShowManualModal(false)}
          onCreated={async (booking)=>{
            setShowManualModal(false);
            // Post accounting entry for the cash collected
            try {
              const ppd = Number(booking?.pricePerDay) || 0;
              const bDays = (booking?.checkIn && booking?.checkOut)
                ? Math.max(1, Math.round((new Date(booking.checkOut)-new Date(booking.checkIn))/864e5))
                : 1;
              const amt = ppd * bDays;
              if (amt > 0) {
                await api.post("/accounting", {
                  type: "income",
                  category: "vehicle_rental",
                  amount: amt,
                  description: `Walk-in rental — ${booking?.vehicleName||"vehicle"} / ${booking?.customerName||"Walk-in Customer"}`,
                  clientName: booking?.customerName || "Walk-in Customer",
                  linkedBookingId: String(booking?._id||""),
                  paymentStatus: "paid",
                  paymentMethod: "cash",
                  date: new Date().toISOString(),
                  notes: `Walk-in booking. Vehicle: ${booking?.vehicleName} | Amount: ₹${amt}`
                });
              }
            } catch(e) { console.warn("Accounting entry failed:", e); }
            await reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Payment Token Modal ──────────────────────────────────────────────────────
function PaymentTokenModal({ booking, suggestedAmount, total, days, onSend, onApproveArrival, onClose }) {
  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount) : "");
  const [error, setError] = useState("");

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

  const handleSend = () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) { setError("Please enter a valid amount."); return; }
    onSend(num);
  };

  const presets = total > 0
    ? [
        { label:"25%", value: Math.round(total*0.25) },
        { label:"50%", value: Math.round(total*0.50) },
        { label:"75%", value: Math.round(total*0.75) },
        { label:"Full", value: total },
      ]
    : [];

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"#0d1b2e",border:"1px solid rgba(212,133,10,0.35)",borderRadius:20,width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display'",fontSize:20,fontWeight:700,color:"#f0c060"}}>💰 Payment Request</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3}}>Set token amount to send to customer</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.4)",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:15}}>✕</button>
        </div>

        <div style={{padding:"20px 24px 24px"}}>
          {/* Booking summary */}
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Customer</span>
              <span style={{fontSize:13,fontWeight:600}}>{booking.customerName}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Vehicle</span>
              <span style={{fontSize:13,fontWeight:600}}>{booking.vehicleName||"—"}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Dates</span>
              <span style={{fontSize:13}}>{fmt(booking.checkIn)} → {fmt(booking.checkOut)} ({days}d)</span>
            </div>
            {total>0&&(
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Total amount</span>
                <span style={{fontSize:15,fontWeight:700,color:"#f0c060"}}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {/* Amount input */}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>
              Token amount to request (₹)
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#f0c060",fontWeight:700}}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={e=>{ setAmount(e.target.value); setError(""); }}
                autoFocus
                placeholder={total > 0 ? `e.g. ₹${Math.round(total*0.5)} (50%)` : "Enter amount"}
                style={{width:"100%",padding:"12px 14px 12px 32px",background:"rgba(255,255,255,0.07)",border:`1.5px solid ${error?"#ff6b6b":"rgba(255,255,255,0.12)"}`,borderRadius:10,color:"white",fontFamily:"'DM Sans'",fontSize:18,fontWeight:700,outline:"none"}}
              />
            </div>
            {error&&<div style={{fontSize:12,color:"#ff6b6b",marginTop:6}}>{error}</div>}
          </div>

          {/* Quick presets */}
          {presets.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Quick select</div>
              <div style={{display:"flex",gap:8}}>
                {presets.map(p=>(
                  <button key={p.label} onClick={()=>{ setAmount(String(p.value)); setError(""); }}
                    style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${amount===String(p.value)?"#d4850a":"rgba(255,255,255,0.1)"}`,background:amount===String(p.value)?"rgba(212,133,10,0.2)":"rgba(255,255,255,0.04)",color:amount===String(p.value)?"#f0c060":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"center"}}>
                    <div>{p.label}</div>
                    <div style={{fontSize:11,marginTop:2}}>₹{p.value.toLocaleString("en-IN")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remaining info */}
          {amount&&!isNaN(Number(amount))&&Number(amount)>0&&total>0&&(
            <div style={{background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"rgba(255,255,255,0.5)",display:"flex",justifyContent:"space-between"}}>
              <span>Remaining at pickup</span>
              <span style={{color:"#4ade80",fontWeight:600}}>₹{Math.max(0,total-Number(amount)).toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* Send button */}
          <button onClick={handleSend}
            style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#25d366,#128c7e)",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            💬 Send Payment Request on WhatsApp
          </button>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:8}}>
            WhatsApp will open — just tap Send to deliver to customer
          </div>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0"}}>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.25)",letterSpacing:1}}>OR</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
          </div>

          {/* Pay on Arrival */}
          <button onClick={onApproveArrival}
            style={{width:"100%",padding:"13px",background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.35)",color:"#a5b4fc",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            🤝 Approve Pay on Arrival
          </button>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:6}}>
            Confirms booking — customer pays full amount at pickup/delivery
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ────────────────────────────────────────────────────
function RecordPaymentModal({ booking, totalAmount=0, onSave, onClose }) {
  // `received` = TOTAL amount received so far (cumulative), not an addition.
  // Pre-fill with existing receivedAmount so editing shows the current state.
  const alreadyReceived = booking.receivedAmount || 0;
  const [received, setReceived] = useState(String(alreadyReceived || ""));
  const [error, setError]       = useState("");
  const isEditing  = alreadyReceived > 0;
  const requested  = booking.tokenAmount || 0;
  const orderTotal = totalAmount > 0 ? totalAmount : (requested * 2) || 0;
  const enteredNum = Number(received) || 0;
  const remaining  = orderTotal > 0 ? Math.max(0, orderTotal - enteredNum) : 0;
  const addedNow   = Math.max(0, enteredNum - alreadyReceived);

  const handleSave = () => {
    const num = Number(received);
    if (!received || isNaN(num) || num < 0) { setError("Please enter a valid amount."); return; }
    if (num === alreadyReceived) { onClose(); return; } // nothing changed
    onSave(num, orderTotal);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div style={{background:"#1a1d2e",border:"1px solid rgba(240,192,96,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:400}}>
        <h3 style={{color:"#f0c060",fontFamily:"'Playfair Display'",margin:"0 0 4px"}}>
          {isEditing ? "✏️ Edit Payment Record" : "💰 Record Payment"}
        </h3>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:"0 0 20px"}}>{booking.customerName} · {booking.vehicleName||"—"}</p>

        {/* Summary row */}
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          {alreadyReceived>0&&(
            <div style={{flex:1,background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:10,padding:"10px 14px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Previously Received</div>
              <div style={{fontSize:18,fontWeight:700,color:"#4ade80"}}>₹{alreadyReceived.toLocaleString("en-IN")}</div>
            </div>
          )}
          {orderTotal>0&&(
            <div style={{flex:1,background:"rgba(240,192,96,0.08)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:10,padding:"10px 14px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Order Total</div>
              <div style={{fontSize:18,fontWeight:700,color:"#f0c060"}}>₹{orderTotal.toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>

        <label style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>
          Total Amount Received (₹) {isEditing&&<span style={{color:"rgba(255,255,255,0.25)",textTransform:"none",letterSpacing:0,fontSize:11}}>— edit to correct</span>}
        </label>
        <input
          type="number" value={received} onChange={e=>{setReceived(e.target.value);setError("");}}
          placeholder="Enter total amount received"
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"white",fontSize:16,boxSizing:"border-box",marginBottom:8}}
          autoFocus
        />
        {error&&<div style={{color:"#ff6b6b",fontSize:12,marginBottom:8}}>{error}</div>}

        {/* Live feedback */}
        {enteredNum>0&&orderTotal>0&&remaining>0&&(
          <div style={{background:"rgba(240,192,96,0.06)",border:"1px solid rgba(240,192,96,0.15)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"rgba(255,255,255,0.6)",marginBottom:10,display:"flex",justifyContent:"space-between"}}>
            <span>Remaining balance</span>
            <span style={{color:"#f0c060",fontWeight:700}}>₹{remaining.toLocaleString("en-IN")}</span>
          </div>
        )}
        {enteredNum>0&&orderTotal>0&&enteredNum>=orderTotal&&(
          <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#4ade80",marginBottom:10}}>
            ✅ Fully paid — booking will be marked Completed
          </div>
        )}
        {isEditing&&addedNow>0&&(
          <div style={{background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#60a5fa",marginBottom:10}}>
            +₹{addedNow.toLocaleString("en-IN")} new payment will be added to accounting
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={handleSave} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"white",cursor:"pointer",fontSize:14,fontWeight:700}}>
            {enteredNum===alreadyReceived?"No Change":isEditing?"Update Payment":"Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pay Page ─────────────────────────────────────────────────────────────────
function PayPage() {
  const params = new URLSearchParams(window.location.search);
  const amount   = params.get("amount")  || "";
  const upi      = params.get("upi")     || "vinay.purbia-2@oksbi";
  const name     = params.get("name")    || "booking";
  const customer = params.get("customer")|| "";

  const upiLink = amount
    ? `upi://pay?pa=${upi}&pn=Travel+Engineers&am=${amount}&cu=INR&tn=Advance+for+${encodeURIComponent(name)}`
    : `upi://pay?pa=${upi}&pn=Travel+Engineers&cu=INR`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiLink)}&bgcolor=1a1a2e&color=f0c060&margin=10`;

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(240,192,96,0.2)",borderRadius:20,padding:36,maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>🛵</div>
        <h2 style={{color:"#f0c060",fontFamily:"'Playfair Display'",fontSize:24,margin:"0 0 4px"}}>Travel Engineers</h2>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:13,margin:"0 0 24px"}}>Payment Request</p>

        {customer && <p style={{color:"rgba(255,255,255,0.7)",fontSize:14,marginBottom:4}}>Hi <strong style={{color:"#fff"}}>{customer}</strong>!</p>}
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginBottom:4}}>For: <strong style={{color:"#f0c060"}}>{name}</strong></p>

        {amount && (
          <div style={{background:"rgba(240,192,96,0.1)",border:"1px solid rgba(240,192,96,0.3)",borderRadius:12,padding:"12px 20px",margin:"16px 0 24px"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:4}}>Token Advance Amount</div>
            <div style={{fontSize:32,fontWeight:700,color:"#f0c060"}}>₹{Number(amount).toLocaleString("en-IN")}</div>
          </div>
        )}

        <div style={{background:"white",borderRadius:12,padding:12,display:"inline-block",marginBottom:20}}>
          <img src={qrUrl} alt="UPI QR Code" width={220} height={220} style={{display:"block"}}/>
        </div>

        <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginBottom:4}}>UPI ID: <span style={{color:"#f0c060",fontWeight:600}}>{upi}</span></p>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginBottom:24}}>Scan with GPay, PhonePe, Paytm or any UPI app</p>

        <a href={upiLink} style={{display:"block",background:"#d4850a",color:"white",padding:"14px 24px",borderRadius:12,textDecoration:"none",fontWeight:600,fontSize:15,marginBottom:12}}>
          Open UPI App to Pay
        </a>
        <a href="https://travel-engineers.vercel.app" style={{display:"block",color:"rgba(255,255,255,0.3)",fontSize:12,textDecoration:"none"}}>
          ← Back to Travel Engineers
        </a>
      </div>
    </div>
  );
}

// ─── MODULES list (mirrors backend) ──────────────────────────────────────────
const MODULES = [
  { id:"dashboard",    label:"Dashboard",    icon:"⊞" },
  { id:"agency",       label:"Agency Info",  icon:"🏢" },
  { id:"rentals",      label:"Rentals",      icon:"🛵" },
  { id:"villa",        label:"Villa",        icon:"🏡" },
  { id:"testimonials", label:"Reviews",      icon:"⭐" },
  { id:"inventory",    label:"Inventory",    icon:"📦" },
  { id:"tours",        label:"Tours & Taxi", icon:"🗺" },
  { id:"accounting",   label:"Accounting",   icon:"💰" },
  { id:"bookings",     label:"Bookings",     icon:"📋" },
];

// ─── StaffLoginModal ──────────────────────────────────────────────────────────
function StaffLoginModal({ agency, onLogin, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const agencyName = agency?.name || "Travel Engineers";
  const heroImage  = agency?.heroImage || "";

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter both fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/users?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) { onLogin(data.user); }
      else { setError(data.error || "Invalid credentials"); }
    } catch { setError("Connection error. Try again."); }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(6,14,26,0.85)",backdropFilter:"blur(6px)"}} />
      {/* Card */}
      <div style={{position:"relative",width:"100%",maxWidth:400,margin:"0 16px",background:"#0d1b2e",borderRadius:20,border:"1px solid rgba(240,192,96,0.15)",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.6)"}}>
        {/* Header band */}
        <div style={{background:"linear-gradient(135deg,#0a1628,#1a2a40)",padding:"32px 36px 28px",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(240,192,96,0.08)"}}>
          {heroImage && <img src={heroImage} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.12}} onError={e=>e.target.style.display="none"} />}
          <div style={{position:"relative"}}>
            <div style={{width:44,height:44,background:"rgba(212,133,10,0.15)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,fontSize:20}}>🔐</div>
            <div style={{fontFamily:"'Playfair Display'",fontSize:22,color:"white",marginBottom:4}}>{agencyName}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase"}}>Staff Portal</div>
          </div>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* Form */}
        <div style={{padding:"28px 36px 32px"}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:8}}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="your.username" autoComplete="username"
              style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"white",fontFamily:"'DM Sans'",fontSize:14,outline:"none",boxSizing:"border-box"}} />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:8}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="••••••••" autoComplete="current-password"
              style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"white",fontFamily:"'DM Sans'",fontSize:14,outline:"none",boxSizing:"border-box"}} />
          </div>
          {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"10px 14px",color:"#f87171",fontSize:13,marginBottom:16}}>{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{width:"100%",background:"linear-gradient(135deg,#d4850a,#f0c060)",color:"#1a1a2e",border:"none",padding:"14px",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans'",opacity:loading?0.7:1}}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StaffPanel ───────────────────────────────────────────────────────────────
function StaffPanel({ staffUser, data, api, reload, onExit }) {
  const [activeTab, setActiveTab] = useState(() => {
    // Default to dashboard if permitted, else first allowed module
    if (staffUser.permissions.includes("dashboard")) return "dashboard";
    return staffUser.permissions[0] || "bookings";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toast_ref = useState(null);
  const [toast, setToast] = useState(null);
  const showSaved = (msg="✅ Saved!", type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  const allowedTabs = MODULES.filter(m => staffUser.permissions.includes(m.id));

  // If current tab not allowed, snap to first allowed
  useEffect(() => {
    if (!staffUser.permissions.includes(activeTab)) {
      setActiveTab(staffUser.permissions.includes("dashboard") ? "dashboard" : staffUser.permissions[0] || "bookings");
    }
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#06111f",fontFamily:"'DM Sans',sans-serif",color:"white",display:"flex",position:"relative",flexDirection:"column"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .staff-nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;border-radius:10px;background:transparent;cursor:pointer;font-family:'DM Sans';font-size:13.5px;font-weight:500;transition:all 0.15s;color:rgba(255,255,255,0.55);}
        .staff-nav-btn.active{background:linear-gradient(135deg,#d4850a,#f0c060)!important;color:#1a1a2e!important;}
        .staff-nav-btn:hover:not(.active){background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.85);}
        @media(max-width:768px){
          .staff-layout{flex-direction:column!important;}
          .staff-sidebar{display:none!important;}
          .staff-sidebar.mobile-open{display:flex!important;position:fixed;inset:0;z-index:200;width:100%!important;height:100%;background:#0d1b2e;}
          .staff-main{width:100%!important;}
          .staff-topbar{padding:0 16px!important;}
          .mobile-menu-btn{display:flex!important;}
        }
      `}</style>
      {toast && <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.type==="error"?"#ef4444":"#16a34a",color:"white",padding:"13px 28px",borderRadius:12,fontSize:15,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>{toast.msg}</div>}

      <div className="staff-layout" style={{display:"flex",flex:1,minHeight:"100vh"}}>
        {/* Sidebar */}
        <div className={`staff-sidebar${mobileMenuOpen?" mobile-open":""}`}
          style={{width:sidebarOpen?220:64,minHeight:"100vh",background:"#0d1b2e",transition:"width 0.2s",display:"flex",flexDirection:"column",padding:"20px 12px",gap:4,flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>

          {/* Top: logo/name */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",marginBottom:12,justifyContent:sidebarOpen?"flex-start":"center"}}>
            {sidebarOpen && (
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#f0c060",lineHeight:1.2}}>Staff Panel</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{staffUser.name}</div>
              </div>
            )}
            {/* Mobile close button */}
            {mobileMenuOpen && (
              <button onClick={()=>setMobileMenuOpen(false)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16}}>✕</button>
            )}
          </div>

          {/* Nav items */}
          <nav style={{flex:1}}>
            {allowedTabs.map(t=>(
              <button key={t.id} className={"staff-nav-btn"+(activeTab===t.id?" active":"")}
                style={{color:activeTab===t.id?"#1a1a2e":"rgba(255,255,255,0.55)",justifyContent:sidebarOpen?"flex-start":"center"}}
                onClick={()=>{ setActiveTab(t.id); reload(); setMobileMenuOpen(false); }}>
                <span style={{fontSize:16}}>{t.icon}</span>
                {sidebarOpen && <span>{t.label}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom: user info + sign out + collapse toggle */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:12,display:"flex",flexDirection:"column",gap:4}}>
            {sidebarOpen && (
              <div style={{padding:"8px 10px",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:600,color:"white"}}>{staffUser.name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{staffUser.designation || "Staff"}</div>
              </div>
            )}
            <button className="staff-nav-btn" onClick={onExit}
              style={{color:"rgba(255,100,100,0.7)",justifyContent:sidebarOpen?"flex-start":"center"}}>
              <span style={{fontSize:16}}>🚪</span>
              {sidebarOpen && <span>Sign Out</span>}
            </button>
            {/* Collapse/expand toggle at bottom */}
            <button onClick={()=>setSidebarOpen(v=>!v)}
              style={{alignSelf:"center",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",width:32,height:28,borderRadius:8,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
              {sidebarOpen?"◀":"▶"}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="staff-main" style={{flex:1,overflowY:"auto",background:"#06111f",minWidth:0}}>
          {/* Top bar */}
          <div className="staff-topbar" style={{background:"#0d1b2e",padding:"0 28px",borderBottom:"1px solid rgba(212,133,10,0.2)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {/* Mobile hamburger */}
              <button onClick={()=>setMobileMenuOpen(true)} style={{display:"none",background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",width:36,height:36,borderRadius:8,cursor:"pointer",fontSize:18,alignItems:"center",justifyContent:"center"}}
                className="mobile-menu-btn">☰</button>
              <div>
                <div style={{fontWeight:700,fontSize:17,color:"#f0c060",fontFamily:"'Playfair Display'"}}>{MODULES.find(m=>m.id===activeTab)?.label||""}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Manage your {(MODULES.find(m=>m.id===activeTab)?.label||"").toLowerCase()}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"right"}}>
              <div style={{fontWeight:600,color:"white"}}>{staffUser.name}</div>
              <div style={{color:"rgba(255,255,255,0.3)"}}>{staffUser.designation||"Staff"}</div>
            </div>
          </div>
          <div style={{padding:"28px 24px",maxWidth:1200}}>
            {activeTab==="dashboard"   && <AdminDashboard    data={data} goTo={setActiveTab}/>}
            {activeTab==="bookings"    && <BookingsEditor     data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="accounting"  && <AccountingEditor   data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="reviews"     && <ReviewsEditor      data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="inventory"   && <InventoryEditor    data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="rentals"     && <RentalsEditor      data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="villa"       && <VillaEditor        data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="tours"       && <ToursEditor        data={data} api={api} reload={reload} showSaved={showSaved}/>}
            {activeTab==="agency"      && <AgencyEditor       data={data} api={api} reload={reload} showSaved={showSaved}/>}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── UsersEditor (Admin only) ─────────────────────────────────────────────────
function UsersEditor({ data, api, reload, showSaved }) {
  const [users, setUsers] = useState(data.users || []);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username:"", password:"", name:"", designation:"", permissions:["bookings"], active:true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const adminToken = sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken") || "";

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { headers:{ "x-admin-token": adminToken } });
      if (res.ok) { const u = await res.json(); setUsers(u); }
    } catch {}
  };

  useEffect(() => { fetchUsers(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ username:"", password:"", name:"", designation:"", permissions:["bookings"], active:true });
    setError("");
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username:u.username, password:"", name:u.name, designation:u.designation||"", permissions:u.permissions||["bookings"], active:u.active!==false });
    setError("");
    setShowForm(true);
  };

  const togglePerm = (id) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(id) ? f.permissions.filter(p=>p!==id) : [...f.permissions, id]
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setError("Name and username are required."); return; }
    if (!editing && !form.password) { setError("Password is required for new users."); return; }
    if (form.permissions.length === 0) { setError("Select at least one permission."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const url = editing ? `/api/users?id=${editing._id}` : "/api/users";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json", "x-admin-token": adminToken },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Save failed."); setSaving(false); return; }
      showSaved(editing ? "✅ User updated!" : "✅ User created!");
      setShowForm(false);
      fetchUsers();
    } catch(e) { setError(e?.message || "Save failed."); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/users?id=${id}`, { method:"DELETE", headers:{ "x-admin-token": adminToken } });
    showSaved("🗑️ User deleted", "delete");
    setConfirmDelete(null);
    fetchUsers();
  };

  const inp = { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:10, color:"white", fontFamily:"'DM Sans'", fontSize:14, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{padding:"28px",fontFamily:"'DM Sans',sans-serif",minHeight:"80vh",background:"#f5f6fa"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display'",fontSize:28,color:"#1a1a2e",margin:0}}>User Management</h2>
          <p style={{fontSize:13,color:"rgba(0,0,0,0.4)",margin:"4px 0 0"}}>{users.length} staff {users.length===1?"member":"members"}</p>
        </div>
        <button onClick={openNew}
          style={{padding:"11px 22px",background:"linear-gradient(135deg,#d4850a,#f0c060)",border:"none",borderRadius:12,color:"white",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          + Add User
        </button>
      </div>

      {/* Users grid */}
      {users.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 20px",color:"rgba(0,0,0,0.3)"}}>
          <div style={{fontSize:48,marginBottom:16}}>👤</div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>No staff users yet</div>
          <div style={{fontSize:14}}>Add users to give them access to specific modules</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {users.map(u => (
            <div key={u._id} style={{background:"white",borderRadius:16,padding:"20px 22px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:`1px solid ${u.active===false?"rgba(239,68,68,0.15)":"rgba(0,0,0,0.06)"}`,position:"relative"}}>
              {u.active===false && (
                <span style={{position:"absolute",top:14,right:14,background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,letterSpacing:"0.5px"}}>INACTIVE</span>
              )}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#d4850a22,#f0c06022)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👤</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a2e"}}>{u.name}</div>
                  <div style={{fontSize:12,color:"rgba(0,0,0,0.4)"}}>{u.designation || "Staff"} · @{u.username}</div>
                </div>
              </div>
              {/* Permissions */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {(u.permissions||[]).map(p => {
                  const mod = MODULES.find(m=>m.id===p);
                  return mod ? (
                    <span key={p} style={{background:"rgba(212,133,10,0.1)",color:"#d4850a",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:4}}>
                      {mod.icon} {mod.label}
                    </span>
                  ) : null;
                })}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>openEdit(u)}
                  style={{flex:1,padding:"9px",background:"rgba(212,133,10,0.08)",border:"1px solid rgba(212,133,10,0.2)",borderRadius:9,color:"#d4850a",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans'"}}>
                  ✏️ Edit
                </button>
                <button onClick={()=>setConfirmDelete(u)}
                  style={{padding:"9px 14px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:9,color:"#ef4444",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans'"}}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Drawer */}
      {showForm && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
          <div onClick={()=>setShowForm(false)} style={{position:"absolute",inset:0,background:"rgba(6,14,26,0.7)",backdropFilter:"blur(4px)"}} />
          <div style={{position:"relative",width:"100%",maxWidth:520,margin:"0 16px",background:"#0d1b2e",borderRadius:20,border:"1px solid rgba(240,192,96,0.12)",overflow:"hidden",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.5)"}}>
            {/* Modal header */}
            <div style={{padding:"24px 28px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"'Playfair Display'",fontSize:20,color:"white"}}>{editing?"Edit User":"Add Staff User"}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3}}>{editing?"Update details and permissions":"Create a new staff login"}</div>
              </div>
              <button onClick={()=>setShowForm(false)} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            {/* Form body */}
            <div style={{padding:"24px 28px"}}>
              {/* Row: name + designation */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:7}}>Full Name *</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Riya Sharma" style={inp} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:7}}>Designation</label>
                  <input value={form.designation} onChange={e=>setForm(f=>({...f,designation:e.target.value}))} placeholder="Booking Agent" style={inp} />
                </div>
              </div>
              {/* Username */}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:7}}>Username *</label>
                <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s/g,"")}))} placeholder="riya.sharma" style={inp} />
              </div>
              {/* Password */}
              <div style={{marginBottom:20}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:7}}>
                  Password {editing && <span style={{color:"rgba(255,255,255,0.2)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(leave blank to keep current)</span>}
                </label>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder={editing?"••••••••  (unchanged)":"Set a password"} style={inp} />
              </div>
              {/* Permissions */}
              <div style={{marginBottom:20}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.5px",display:"block",marginBottom:12}}>Module Permissions *</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {MODULES.map(m => {
                    const checked = form.permissions.includes(m.id);
                    return (
                      <button key={m.id} onClick={()=>togglePerm(m.id)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${checked?"#d4850a":"rgba(255,255,255,0.08)"}`,background:checked?"rgba(212,133,10,0.12)":"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans'"}}>
                        <span style={{fontSize:16}}>{m.icon}</span>
                        <span style={{fontSize:13,fontWeight:checked?600:400,color:checked?"#f0c060":"rgba(255,255,255,0.5)"}}>{m.label}</span>
                        {checked && <span style={{marginLeft:"auto",color:"#d4850a",fontSize:16}}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Active toggle */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                <button onClick={()=>setForm(f=>({...f,active:!f.active}))}
                  style={{width:44,height:24,borderRadius:12,background:form.active?"#d4850a":"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:form.active?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
                </button>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"white"}}>Account Active</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Inactive users cannot log in</div>
                </div>
              </div>
              {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 14px",color:"#f87171",fontSize:13,marginBottom:16}}>{error}</div>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"13px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"rgba(255,255,255,0.6)",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans'"}}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  style={{flex:2,padding:"13px",background:"linear-gradient(135deg,#d4850a,#f0c060)",border:"none",borderRadius:12,color:"#1a1a2e",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans'",opacity:saving?0.7:1}}>
                  {saving?"Saving…":(editing?"Update User":"Create User")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{position:"fixed",inset:0,zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={()=>setConfirmDelete(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}} />
          <div style={{position:"relative",background:"#0d1b2e",borderRadius:16,padding:"28px 32px",maxWidth:380,width:"100%",margin:"0 16px",border:"1px solid rgba(239,68,68,0.2)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div style={{fontFamily:"'Playfair Display'",fontSize:20,color:"white",marginBottom:8}}>Delete User?</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24}}>Remove <strong style={{color:"white"}}>{confirmDelete.name}</strong> (@{confirmDelete.username})? This cannot be undone.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:14}}>Cancel</button>
              <button onClick={()=>handleDelete(confirmDelete._id)} style={{flex:1,padding:"12px",background:"#ef4444",border:"none",borderRadius:10,color:"white",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:14}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
