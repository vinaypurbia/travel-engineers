// TravelAssistant.jsx
// Drop this anywhere in your app — it renders a floating chat widget
// Uses Gemini 1.5 Flash free tier via /api/chat (see chat.js for the backend route)
// WhatsApp number: update WHATSAPP_NUMBER below

import { useState, useRef, useEffect } from "react";

const WHATSAPP_NUMBER = "919XXXXXXXXX"; // ← replace with your WhatsApp number (country code + number, no +)

const SYSTEM_PROMPT = `You are the Travel Engineers assistant — a friendly, knowledgeable helper for a vehicle rental, villa stay, and tours & taxi service based in Udaipur, Rajasthan, India.

Your job is to help customers with:
- Vehicle rentals (scooters, bikes, cars — daily rates around ₹300-500/day)
- Tours & taxi bookings (sightseeing, airport transfers, outstation)
- Villa stays (luxury accommodation)
- Pricing, availability questions
- Location, directions, how to reach us
- Payment options (cash, UPI, online)
- Booking process (online or walk-in)

Keep replies short, warm, and helpful. Use bullet points for lists. Always end with a gentle nudge to book or contact us on WhatsApp if they need more help. Never make up prices you're not sure about — instead say "please WhatsApp us for the latest rates."

Website: travelengineers.online
WhatsApp: +91-XXXXXXXXXX (update this)
Location: Udaipur, Rajasthan`;

const QUICK_REPLIES = [
  { label: "🛵 Vehicle prices", msg: "What are your vehicle rental prices?" },
  { label: "🗺️ Tours available", msg: "What tours do you offer?" },
  { label: "🏡 Villa stays", msg: "Tell me about villa stays" },
  { label: "📍 Location", msg: "Where are you located?" },
  { label: "💳 Payment options", msg: "What payment methods do you accept?" },
  { label: "📅 How to book", msg: "How do I make a booking?" },
];

export default function TravelAssistant() {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState("chat"); // "chat" | "whatsapp"
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your Travel Engineers assistant.\n\nI can help you with vehicle rentals, tours, villa stays, pricing, and bookings. What would you like to know?",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [shown, setShown]     = useState(false); // bubble shown after delay
  const [pulse, setPulse]     = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Show bubble after 3s
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Pulse notification dot
  useEffect(() => {
    if (!open) {
      const t = setInterval(() => setPulse(p => !p), 2000);
      return () => clearInterval(t);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          system: SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, I couldn't process that. Please try again or contact us on WhatsApp.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please WhatsApp us directly for help! 😊" }]);
    }
    setLoading(false);
  };

  const openWhatsApp = (msg = "") => {
    const text = msg || "Hi! I need help with a booking at Travel Engineers.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatMsg = (text) =>
    text.split("\n").map((line, i) => <span key={i}>{line}<br/></span>);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .te-chat-widget * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        .te-chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
        .te-chat-fab {
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #d4850a, #f0c060);
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(212,133,10,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .te-chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(212,133,10,0.6); }
        .te-chat-fab-icon { font-size: 26px; transition: transform 0.3s; }
        .te-chat-dot {
          position: absolute; top: 2px; right: 2px;
          width: 13px; height: 13px; background: #4ade80;
          border-radius: 50%; border: 2px solid #06111f;
          transition: opacity 0.4s;
        }
        .te-chat-bubble {
          position: absolute; bottom: 70px; right: 0;
          background: #0d1b2e; border: 1px solid rgba(212,133,10,0.3);
          color: white; padding: 10px 14px; border-radius: 12px 12px 0 12px;
          font-size: 13px; font-weight: 500; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: te-fade-up 0.4s ease;
        }
        .te-chat-bubble::after {
          content: ""; position: absolute; bottom: -8px; right: 14px;
          border: 8px solid transparent; border-top-color: #0d1b2e;
          border-bottom: none;
        }
        .te-chat-window {
          position: absolute; bottom: 70px; right: 0;
          width: 360px; max-height: 540px;
          background: #06111f; border-radius: 18px;
          border: 1px solid rgba(212,133,10,0.2);
          box-shadow: 0 12px 48px rgba(0,0,0,0.6);
          display: flex; flex-direction: column; overflow: hidden;
          animation: te-pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes te-pop-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes te-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .te-chat-header {
          background: linear-gradient(135deg, #0d1b2e 0%, #0f2035 100%);
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          border-bottom: 1px solid rgba(212,133,10,0.15);
        }
        .te-chat-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #d4850a, #f0c060);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .te-tab-bar {
          display: flex; background: #0d1b2e;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .te-tab {
          flex: 1; padding: 10px; border: none; background: transparent;
          color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px;
          border-bottom: 2px solid transparent;
        }
        .te-tab.active { color: #f0c060; border-bottom-color: #d4850a; }
        .te-messages {
          flex: 1; overflow-y: auto; padding: 14px 12px; display: flex;
          flex-direction: column; gap: 10px; min-height: 0;
          scrollbar-width: thin; scrollbar-color: rgba(212,133,10,0.2) transparent;
        }
        .te-msg {
          max-width: 85%; padding: 10px 13px; border-radius: 14px;
          font-size: 13.5px; line-height: 1.55; animation: te-fade-up 0.2s ease;
        }
        .te-msg.user {
          background: linear-gradient(135deg, #d4850a, #c07308);
          color: white; align-self: flex-end; border-radius: 14px 14px 3px 14px;
        }
        .te-msg.assistant {
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9);
          align-self: flex-start; border-radius: 14px 14px 14px 3px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .te-typing { display: flex; gap: 4px; padding: 4px 2px; }
        .te-typing span {
          width: 7px; height: 7px; background: rgba(212,133,10,0.6);
          border-radius: 50%; animation: te-bounce 1.2s infinite;
        }
        .te-typing span:nth-child(2) { animation-delay: 0.2s; }
        .te-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes te-bounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .te-quick-replies {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 4px;
        }
        .te-qr {
          padding: 5px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600;
          background: rgba(212,133,10,0.1); border: 1px solid rgba(212,133,10,0.3);
          color: #f0c060; cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .te-qr:hover { background: rgba(212,133,10,0.2); transform: translateY(-1px); }
        .te-input-row {
          display: flex; gap: 8px; padding: 10px 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: #0d1b2e;
        }
        .te-input {
          flex: 1; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 9px 13px; color: white; font-size: 13px;
          outline: none; transition: border-color 0.2s; font-family: 'DM Sans',sans-serif;
        }
        .te-input:focus { border-color: rgba(212,133,10,0.5); }
        .te-input::placeholder { color: rgba(255,255,255,0.25); }
        .te-send {
          width: 38px; height: 38px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #d4850a, #f0c060);
          color: #1a1a2e; cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 16px; flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }
        .te-send:hover { opacity: 0.9; transform: scale(1.05); }
        .te-send:disabled { opacity: 0.4; cursor: default; transform: none; }
        .te-wa-panel { padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .te-wa-btn {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          border-radius: 12px; border: none; cursor: pointer; font-size: 14px;
          font-weight: 600; transition: all 0.2s; font-family: 'DM Sans',sans-serif;
        }
        .te-wa-btn.green { background: #25d366; color: white; }
        .te-wa-btn.green:hover { background: #1fba57; }
        .te-wa-btn.outline {
          background: transparent; border: 1.5px solid rgba(37,211,102,0.4);
          color: #25d366;
        }
        .te-wa-btn.outline:hover { background: rgba(37,211,102,0.08); }
        .te-wa-hint { font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; margin-top: 4px; }
        @media (max-width: 400px) {
          .te-chat-window { width: calc(100vw - 24px); right: -12px; }
        }
      `}</style>

      <div className="te-chat-widget">
        {/* Bubble teaser */}
        {shown && !open && (
          <div className="te-chat-bubble" onClick={() => setOpen(true)} style={{cursor:"pointer"}}>
            ✈️ Need help with your trip?
          </div>
        )}

        {/* Chat window */}
        {open && (
          <div className="te-chat-window">
            {/* Header */}
            <div className="te-chat-header">
              <div className="te-chat-avatar">✈️</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:"#f0c060"}}>Travel Engineers</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:6,height:6,background:"#4ade80",borderRadius:"50%",display:"inline-block"}}/>
                  Online — reply in seconds
                </div>
              </div>
              <button onClick={()=>setOpen(false)}
                style={{background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.5)",width:28,height:28,borderRadius:8,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="te-tab-bar">
              <button className={`te-tab${tab==="chat"?" active":""}`} onClick={()=>setTab("chat")}>
                💬 Chat with AI
              </button>
              <button className={`te-tab${tab==="whatsapp"?" active":""}`} onClick={()=>setTab("whatsapp")}>
                📱 WhatsApp
              </button>
            </div>

            {/* Chat tab */}
            {tab === "chat" && (
              <>
                <div className="te-messages">
                  {messages.map((m, i) => (
                    <div key={i} className={`te-msg ${m.role}`}>
                      {formatMsg(m.content)}
                    </div>
                  ))}
                  {loading && (
                    <div className="te-msg assistant">
                      <div className="te-typing">
                        <span/><span/><span/>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>

                {/* Quick replies — only show when 1 message (opening state) */}
                {messages.length <= 1 && (
                  <div className="te-quick-replies">
                    {QUICK_REPLIES.map((q,i) => (
                      <button key={i} className="te-qr" onClick={()=>send(q.msg)}>{q.label}</button>
                    ))}
                  </div>
                )}

                <div className="te-input-row">
                  <input
                    ref={inputRef}
                    className="te-input"
                    value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
                    placeholder="Ask anything about bookings…"
                    disabled={loading}
                  />
                  <button className="te-send" onClick={()=>send()} disabled={!input.trim()||loading}>
                    ➤
                  </button>
                </div>
              </>
            )}

            {/* WhatsApp tab */}
            {tab === "whatsapp" && (
              <div className="te-wa-panel">
                <div style={{textAlign:"center",padding:"8px 0 4px"}}>
                  <div style={{fontSize:36,marginBottom:8}}>📱</div>
                  <div style={{fontWeight:700,fontSize:15,color:"white",marginBottom:4}}>Chat on WhatsApp</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>We reply within minutes — even late evenings</div>
                </div>

                <button className="te-wa-btn green" onClick={()=>openWhatsApp()}>
                  <span style={{fontSize:20}}>💬</span>
                  Start WhatsApp Chat
                </button>

                <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center"}}>— or send a specific message —</div>

                {[
                  { label:"🛵 Ask about vehicles", msg:"Hi! I'd like to know about your vehicle rental options and pricing." },
                  { label:"🗺️ Book a tour", msg:"Hi! I'd like to book a tour. Can you share available options?" },
                  { label:"🏡 Villa inquiry", msg:"Hi! I'm interested in a villa stay. Please share details." },
                  { label:"📅 Make a booking", msg:"Hi! I'd like to make a booking. Please guide me." },
                ].map((item,i)=>(
                  <button key={i} className="te-wa-btn outline" onClick={()=>openWhatsApp(item.msg)}>
                    {item.label}
                  </button>
                ))}

                <div className="te-wa-hint">Opens WhatsApp with a pre-filled message</div>
              </div>
            )}
          </div>
        )}

        {/* FAB button */}
        <button className="te-chat-fab" onClick={()=>{ setOpen(o=>!o); setShown(false); }}>
          <span className="te-chat-fab-icon">{open ? "✕" : "✈️"}</span>
          {!open && <span className="te-chat-dot" style={{opacity: pulse ? 1 : 0.4}}/>}
        </button>
      </div>
    </>
  );
}
