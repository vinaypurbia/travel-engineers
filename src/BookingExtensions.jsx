// ─────────────────────────────────────────────────────────────────────────────
// Travel Engineers — Booking Extensions v2
// Google Cloud Vision OCR + Cloudinary ID image upload with compression
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";

const apiCall = {
  post: (path, body) =>
    fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
  put: (path, body) =>
    fetch(`/api${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.text()).then(t => t ? JSON.parse(t) : {}),
};

const ID_TYPES = ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID", "National ID", "Other"];

// Shared input / label styles (matches App.jsx dark admin theme)
const inp = {
  width: "100%", padding: "10px 14px",
  background: "#0d1b2e",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "white",
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
// Select-specific overrides: solid bg + custom arrow so system chrome doesn't bleed through
const inpSel = {
  ...inp,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f0c060' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
  letterSpacing: 2, marginBottom: 6,
};

// Injected once per page to make <option> elements readable inside dark selects.
// Inline styles on <option> are ignored by most browsers; only CSS works.
const DARK_SELECT_STYLE = `
  .te-dark-sel option,
  .te-dark-sel optgroup {
    background: #0d1b2e !important;
    color: #ffffff !important;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Image compression utility
// Resizes + compresses the image in-browser before sending to server
// Target: readable for OCR but small enough to upload fast
// ─────────────────────────────────────────────────────────────────────────────
function compressImage(file, { maxWidth = 1600, maxHeight = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate dimensions keeping aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // White background (handles transparent PNGs)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => resolve({
            base64: reader.result.split(",")[1],
            dataUrl: reader.result,
            mimeType: "image/jpeg",
            sizeKB: Math.round(blob.size / 1024),
            width, height,
          });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = objectUrl;
  });
}

// Compress from a canvas capture (for live camera)
function compressCanvas(canvas, { quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    resolve({
      base64: dataUrl.split(",")[1],
      dataUrl,
      mimeType: "image/jpeg",
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared ID form fields — used in both CustomerIdPanel and ManualBookingModal
// ─────────────────────────────────────────────────────────────────────────────
function IdFormFields({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <style>{DARK_SELECT_STYLE}</style>
      <div style={{ gridColumn: "1/-1" }}>
        <label style={lbl}>Customer Full Name</label>
        <input style={inp} value={form.customerName || ""} onChange={e => set("customerName", e.target.value)} placeholder="As printed on document" />
      </div>
      <div>
        <label style={lbl}>Phone</label>
        <input style={inp} value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+91 / +965 …" />
      </div>
      <div>
        <label style={lbl}>Email</label>
        <input style={inp} value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="Optional" type="email" />
      </div>
      <div>
        <label style={lbl}>ID Type</label>
        <select className="te-dark-sel" style={inpSel} value={form.idType || ""} onChange={e => set("idType", e.target.value)}>
          <option value="">— Select —</option>
          {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>ID Number</label>
        <input style={inp} value={form.idNumber || ""} onChange={e => set("idNumber", e.target.value)} placeholder="Document number" />
      </div>
      <div>
        <label style={lbl}>Date of Birth</label>
        <input type="date" style={{ ...inp, colorScheme: "dark" }} value={form.dateOfBirth || ""} onChange={e => set("dateOfBirth", e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Gender</label>
        <select className="te-dark-sel" style={inpSel} value={form.gender || ""} onChange={e => set("gender", e.target.value)}>
          <option value="">— Select —</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label style={lbl}>Nationality</label>
        <input style={inp} value={form.nationality || ""} onChange={e => set("nationality", e.target.value)} placeholder="e.g. Indian, Kuwaiti" />
      </div>
      <div style={{ gridColumn: "1/-1" }}>
        <label style={lbl}>Address (from document)</label>
        <textarea rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Permanent address on document" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scan Panel — reusable camera/upload + OCR section
// Used inside both CustomerIdPanel and ManualBookingModal
// ─────────────────────────────────────────────────────────────────────────────
export function ScanPanel({ customerName, onScanned, onImageUrl, onRemoved }) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const runScan = async (base64, mimeType, dataUrl) => {
    setScanning(true);
    setScanError("");
    setPreviewUrl(dataUrl);
    try {
      const result = await apiCall.post("/bookings?scan_id=true", {
        imageBase64: base64,
        mimeType,
        customerName: customerName || "customer",
        uploadImage: true,
      });
      if (result.error) {
        setScanError(result.error);
      } else {
        if (result.imageUrl && onImageUrl) onImageUrl(result.imageUrl);
        if (result.imageUploadError) {
          // Scan text succeeded but the photo itself failed to save — this must
          // be visible, otherwise idType/idNumber look fine while idImageUrl
          // silently stays empty.
          setScanError("⚠️ ID details extracted, but the photo failed to save: " + result.imageUploadError);
        }
        if (onScanned) onScanned(result);
      }
    } catch (err) {
      setScanError(err.message || "Scan failed");
    }
    setScanning(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError("");
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      setCompressionInfo({ originalKB, compressedKB: compressed.sizeKB });
      await runScan(compressed.base64, compressed.mimeType, compressed.dataUrl);
    } catch (err) {
      setScanError("Could not process image: " + err.message);
    }
  };

  const openCamera = async () => {
    setCameraOpen(true);
    setScanError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setScanError("Camera access denied. Please use file upload.");
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    closeCamera();
    const compressed = await compressCanvas(c);
    await runScan(compressed.base64, compressed.mimeType, compressed.dataUrl);
  };

  return (
    <div>
      <style>{`@keyframes te-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Info banner */}
      <div style={{
        background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
        borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12,
        color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
      }}>
        📋 Works for Indian documents (Aadhaar, PAN, Driving Licence, Voter ID) and international documents (Passport, National ID, Driving Licence).
        Image is automatically compressed and saved securely to Cloudinary.
        <strong style={{ color: "rgba(255,255,255,0.7)" }}> Free scans</strong> via Gemini AI (no billing needed).
      </div>

      {/* Upload + Camera buttons */}
      {!scanning && !previewUrl && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <label style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: "1.5px dashed rgba(255,255,255,0.15)",
            borderRadius: 10, padding: "18px 12px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,133,10,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
          >
            <span style={{ fontSize: 26 }}>📂</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans'", fontWeight: 600 }}>Upload Photo</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>JPG · PNG · HEIC</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>

          <button onClick={openCamera} style={{
            flex: 1, background: "rgba(96,165,250,0.06)",
            border: "1.5px dashed rgba(96,165,250,0.25)",
            borderRadius: 10, padding: "18px 12px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            color: "#60a5fa", transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(96,165,250,0.5)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"}
          >
            <span style={{ fontSize: 26 }}>📷</span>
            <span style={{ fontSize: 13, fontFamily: "'DM Sans'", fontWeight: 600 }}>Live Camera</span>
            <span style={{ fontSize: 11, color: "rgba(96,165,250,0.5)" }}>Point & capture</span>
          </button>
        </div>
      )}

      {/* Live camera view */}
      {cameraOpen && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000" }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
            {/* Overlay guide */}
            <div style={{
              position: "absolute", inset: 0, border: "2px dashed rgba(212,133,10,0.6)",
              borderRadius: 10, pointerEvents: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.7)",
                fontSize: 12, padding: "4px 12px", borderRadius: 20, fontFamily: "'DM Sans'",
              }}>
                Align ID within frame
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button onClick={capturePhoto} style={{
              flex: 2, padding: "12px",
              background: "linear-gradient(135deg,#d4850a,#f0c060)",
              color: "#1a1a2e", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              📸 Capture & Scan
            </button>
            <button onClick={closeCamera} style={{
              flex: 1, padding: "12px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)", borderRadius: 8, cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && !cameraOpen && (
        <div style={{ marginBottom: 14, position: "relative" }}>
          <img src={previewUrl} alt="ID" style={{
            width: "100%", maxHeight: 200, objectFit: "contain",
            borderRadius: 10, background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
          }} />
          {compressionInfo && (
            <div style={{
              position: "absolute", bottom: 8, right: 8,
              background: "rgba(0,0,0,0.7)", color: "#4ade80",
              fontSize: 10, padding: "3px 8px", borderRadius: 6, fontFamily: "'DM Sans'",
            }}>
              {compressionInfo.originalKB}KB → {compressionInfo.compressedKB}KB
            </div>
          )}
          {!scanning && (
            <button onClick={() => {
              setPreviewUrl(null);
              setCompressionInfo(null);
              setScanError("");
              if (onImageUrl) onImageUrl("");   // clear stored image URL in parent
              if (onRemoved) onRemoved();        // let parent reset any "Scanned" badge/state
            }} style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,0.6)", border: "none",
              color: "white", width: 26, height: 26, borderRadius: "50%",
              cursor: "pointer", fontSize: 13, display: "flex",
              alignItems: "center", justifyContent: "center",
            }} title="Remove this photo — it won't be sent">✕</button>
          )}
        </div>
      )}

      {/* Scanning indicator */}
      {scanning && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", borderRadius: 10,
          background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
          marginBottom: 14,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            border: "2px solid rgba(96,165,250,0.3)", borderTopColor: "#60a5fa",
            animation: "te-spin 0.8s linear infinite",
          }} />
          <div>
            <div style={{ fontSize: 13, color: "#60a5fa", fontFamily: "'DM Sans'", fontWeight: 600 }}>
              Reading document with Gemini AI…
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              Compressing and uploading image to Cloudinary
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {scanError && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 14,
          background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)",
          color: "#ff6b6b", fontSize: 13,
        }}>
          ❌ {scanError}
          <button onClick={() => { setPreviewUrl(null); setScanError(""); }} style={{
            marginLeft: 10, background: "transparent", border: "none",
            color: "#ff6b6b", cursor: "pointer", fontSize: 12, textDecoration: "underline",
          }}>Try again</button>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// CustomerIdPanel
// Shown inside each expanded booking row in BookingsEditor
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerIdPanel({ booking, onUpdated }) {
  const [mode, setMode] = useState("view");   // view | scan | manual
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [scanDone, setScanDone] = useState(false);

  const [form, setForm] = useState({
    customerName: booking.customerName || "",
    phone:        booking.phone        || "",
    email:        booking.email        || "",
    idType:       booking.idType       || "",
    idNumber:     booking.idNumber     || "",
    dateOfBirth:  booking.dateOfBirth  ? booking.dateOfBirth.slice(0, 10) : "",
    gender:       booking.gender       || "",
    nationality:  booking.nationality  || "",
    address:      booking.address      || "",
    idImageUrl:   booking.idImageUrl   || "",
  });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Called when Google Vision returns scan results
  const handleScanned = (result) => {
    setScanDone(true);
    setForm(f => ({
      ...f,
      idType:      result.idType      || f.idType,
      idNumber:    result.idNumber    || f.idNumber,
      dateOfBirth: result.dateOfBirth || f.dateOfBirth,
      gender:      result.gender      || f.gender,
      nationality: result.nationality || f.nationality,
      address:     result.address     || f.address,
      // Only overwrite name if blank
      customerName: (!f.customerName || f.customerName.trim() === "")
        ? (result.fullName || f.customerName)
        : f.customerName,
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiCall.put(`/bookings?id=${booking._id}`, {
        ...booking,
        customerName: form.customerName || booking.customerName,
        phone:        form.phone        || booking.phone,
        email:        form.email        || null,
        idType:       form.idType       || null,
        idNumber:     form.idNumber     || null,
        idImageUrl:   form.idImageUrl   || null,
        dateOfBirth:  form.dateOfBirth  || null,
        gender:       form.gender       || null,
        nationality:  form.nationality  || null,
        address:      form.address      || null,
      });
      showToast("✅ Customer details saved!");
      if (onUpdated) onUpdated();
      setMode("view");
      setScanDone(false);
    } catch (err) {
      showToast("❌ " + (err.message || "Save failed"), false);
    }
    setSaving(false);
  };

  const hasId = booking.idType && booking.idNumber;

  return (
    <div style={{
      gridColumn: "1/-1", marginTop: 8,
      background: "rgba(212,133,10,0.04)",
      border: "1px solid rgba(212,133,10,0.18)",
      borderRadius: 12, overflow: "hidden",
    }}>

      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: toast.ok ? "#16a34a" : "#ef4444",
          color: "white", padding: "13px 28px", borderRadius: 12,
          fontFamily: "'DM Sans'", fontSize: 15, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header row */}
      <div style={{
        padding: "10px 16px",
        background: "rgba(212,133,10,0.07)",
        borderBottom: "1px solid rgba(212,133,10,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>🪪</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0c060" }}>Customer ID & Details</span>
          {hasId
            ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>✓ {booking.idType}</span>
            : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6b6b" }}>No ID on file</span>
          }
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {mode === "view" && (
            <>
              <button onClick={() => setMode("scan")} style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📷 Scan ID</button>
              <button onClick={() => setMode("manual")} style={{ background: "rgba(212,133,10,0.12)", border: "1px solid rgba(212,133,10,0.3)", color: "#f0c060", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✏️ Edit ID</button>
            </>
          )}
          {mode !== "view" && (
            <button onClick={() => { setMode("view"); setScanDone(false); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Cancel</button>
          )}
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* VIEW */}
        {mode === "view" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: booking.idImageUrl ? 16 : 0 }}>
              {[
                ["ID Type",     booking.idType],
                ["ID Number",   booking.idNumber],
                ["Email",       booking.email],
                ["Nationality", booking.nationality],
                ["D.O.B",       booking.dateOfBirth ? new Date(booking.dateOfBirth).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : null],
                ["Gender",      booking.gender],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: value ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)", fontStyle: value ? "normal" : "italic" }}>{value || "—"}</div>
                </div>
              ))}
            </div>
            {/* Show stored ID image if exists */}
            {booking.idImageUrl && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Stored ID Image</div>
                <a href={booking.idImageUrl} target="_blank" rel="noreferrer">
                  <img src={booking.idImageUrl} alt="ID document" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", objectFit: "contain", background: "rgba(0,0,0,0.3)", cursor: "pointer" }} />
                </a>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Click to open full size</div>
              </div>
            )}
          </div>
        )}

        {/* SCAN */}
        {mode === "scan" && (
          <div>
            <ScanPanel
              customerName={booking.customerName}
              onScanned={handleScanned}
              onImageUrl={(url) => setForm(f => ({ ...f, idImageUrl: url }))}
              onRemoved={() => { setScanDone(false); setForm(f => ({ ...f, idImageUrl: "" })); }}
            />
            {scanDone && (
              <div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 12, marginBottom: 14 }}>
                  ✅ Scan complete — review extracted details below and save
                </div>
                <IdFormFields form={form} setForm={setForm} />
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={save} disabled={saving} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#d4850a,#f0c060)", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "💾 Save Customer Details"}
                  </button>
                  <button onClick={() => setScanDone(false)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 8, cursor: "pointer" }}>Rescan</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANUAL EDIT */}
        {mode === "manual" && (
          <div>
            <IdFormFields form={form} setForm={setForm} />
            <button onClick={save} disabled={saving} style={{ width: "100%", marginTop: 14, padding: "11px", background: "linear-gradient(135deg,#d4850a,#f0c060)", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ManualBookingModal
// 3-step walk-in booking form for admin
// ─────────────────────────────────────────────────────────────────────────────
export function ManualBookingModal({ rentals = [], onClose, onCreated, checkConflict }) {
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState("details"); // details | id | confirm
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scanDone, setScanDone] = useState(false);
  const [replaceId, setReplaceId] = useState(false); // toggle replace ID panel
  const [conflict, setConflict] = useState(null); // booking conflict for selected vehicle+dates

  // ── Customer search ────────────────────────────────────────────────────────
  const [custSearch, setCustSearch]   = useState("");
  const [custResults, setCustResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [custDropOpen, setCustDropOpen] = useState(false);
  const custTimer = useRef(null);

  const searchCustomers = (q) => {
    setCustSearch(q);
    set("customerName", q);
    if (!q || q.length < 2) { setCustResults([]); setCustDropOpen(false); return; }
    clearTimeout(custTimer.current);
    custTimer.current = setTimeout(async () => {
      setCustLoading(true);
      try {
        const res = await fetch(`/api/bookings?resource=customers&q=${encodeURIComponent(q)}`).then(r => r.json());
        const list = Array.isArray(res) ? res : (res.customers || []);
        const mapped = list
          .filter(c => c.name && c.name !== "Walk-in Customer")
          .map(c => ({
            customerName: c.name,
            phone:        c.phone        || "",
            email:        c.email        || "",
            nationality:  c.nationality  || "",
            idType:       c.idType       || "",
            idNumber:     c.idNumber     || "",
            idImageUrl:   c.idImageUrl   || "",
            dateOfBirth:  c.dateOfBirth  || "",
            gender:       c.gender       || "",
            address:      c.address      || "",
            stayAddress:  c.lastStayAddress || "",
            vehicleName:  c.lastVehicle  || "",
            checkIn:      c.lastBooking  || "",
          }));
        setCustResults(mapped.slice(0, 8));
        setCustDropOpen(mapped.length > 0);
      } catch(e) { setCustResults([]); }
      setCustLoading(false);
    }, 350);
  };

  const selectCustomer = (b) => {
    setCustSearch(b.customerName);
    setCustDropOpen(false);
    setReplaceId(false); // reset replace mode when switching customer
    setForm(f => ({
      ...f,
      customerName: b.customerName  || f.customerName,
      phone:        b.phone         || f.phone,
      email:        b.email         || f.email,
      nationality:  b.nationality   || f.nationality,
      stayAddress:  b.stayAddress   || f.stayAddress,
      idType:       b.idType        || f.idType,
      idNumber:     b.idNumber      || f.idNumber,
      idImageUrl:   b.idImageUrl    || f.idImageUrl,
      dateOfBirth:  b.dateOfBirth   || f.dateOfBirth,
      gender:       b.gender        || f.gender,
      address:      b.address       || f.address,
    }));
  };

  const [form, setForm] = useState({
    customerName: "", phone: "", email: "",
    vehicleId: "", vehicleName: "", vehicleNumber: "",
    checkIn: today, checkOut: "",
    stayAddress: "", notes: "",
    pricePerDay: "",
    idType: "", idNumber: "", idImageUrl: "",
    nationality: "", dateOfBirth: "", gender: "", address: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const available = rentals.filter(r => r.available);

  const days = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 864e5))
    : 0;
  const priceNum = Number(form.pricePerDay) || 0;
  const total = priceNum * days;

  const updateConflict = (vid, ci, co) => {
    if (checkConflict) setConflict(checkConflict(vid, ci, co));
    else setConflict(null);
  };

  const selectVehicle = (vehicleId) => {
    if (vehicleId === "__custom__") { set("vehicleId", "__custom__"); set("vehicleName", ""); set("vehicleNumber", ""); setConflict(null); return; }
    const r = available.find(r => r._id === vehicleId);
    if (r) {
      const price = r.price ? Number(String(r.price).replace(/[^0-9.]/g, "")) : 0;
      const numFromName = (r.vehicleNo || r.registrationNo || r.vehicleNumber || "");
      const numFromHash = !numFromName ? ((r.name||"").match(/#([A-Z0-9\s]+)/i)||[])[1]?.trim() || "" : "";
      const vehicleNumber = numFromName || numFromHash;
      setForm(f => ({ ...f, vehicleId, vehicleName: r.name, pricePerDay: price ? String(price) : f.pricePerDay, vehicleNumber: vehicleNumber || f.vehicleNumber }));
      updateConflict(vehicleId, form.checkIn, form.checkOut);
    }
  };

  const handleScanned = (result) => {
    setScanDone(true);
    setForm(f => ({
      ...f,
      idType:      result.idType      || f.idType,
      idNumber:    result.idNumber    || f.idNumber,
      dateOfBirth: result.dateOfBirth || f.dateOfBirth,
      gender:      result.gender      || f.gender,
      nationality: result.nationality || f.nationality,
      address:     result.address     || f.address,
      customerName: (!f.customerName || f.customerName.trim() === "")
        ? (result.fullName || f.customerName)
        : f.customerName,
    }));
  };

  const submit = async () => {
    if (!form.customerName.trim()) { setError("Customer name is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    if (!form.vehicleName.trim()) { setError("Vehicle is required."); return; }
    if (!form.checkIn) { setError("Check-in date is required."); return; }
    if (!form.checkOut) { setError("Check-out date is required."); return; }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) { setError("Check-out must be after check-in."); return; }
    setError("");
    setSaving(true);
    try {
      const result = await apiCall.post("/bookings", { ...form, pricePerDay: priceNum, source: "walkin" });
      if (result.success) {
        // Normalise the returned booking — some API responses omit fields like `source`.
        // Fall back to the form data so onCreated always receives a usable object.
        const returnedBooking = result.booking || result.data || {};
        const resolvedBooking = {
          ...form,
          pricePerDay: priceNum,
          source: "walkin",
          ...returnedBooking,
          // Always enforce source so isWalkin() works even if the API strips it
          source: "walkin",
        };
        if (onCreated) onCreated(resolvedBooking);
        onClose();
      } else setError("Something went wrong. Try again.");
    } catch (err) {
      setError(err.message || "Save failed.");
    }
    setSaving(false);
  };

  const stepList = [["details","📋 Details"], ["id","🪪 ID Scan"], ["confirm","✅ Confirm"]];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div style={{
        position: "relative", background: "#0d1b2e",
        border: "1px solid rgba(212,133,10,0.3)", borderRadius: 20,
        width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#0d1b2e", zIndex: 10, gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700, color: "#f0c060" }}>🏪 Walk-in Booking</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Admin entry — saved as Confirmed</div>
          </div>

          {/* Step tabs */}
          <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
            {stepList.map(([s, label]) => (
              <button key={s} onClick={() => setStep(s)} style={{
                padding: "5px 11px", borderRadius: 6, border: "none",
                background: step === s ? "rgba(212,133,10,0.25)" : "transparent",
                color: step === s ? "#f0c060" : "rgba(255,255,255,0.3)",
                cursor: "pointer", fontSize: 12, fontWeight: step === s ? 600 : 400,
                fontFamily: "'DM Sans'",
              }}>
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "20px 22px 28px" }}>

          {/* ── STEP 1: Details ── */}
          {step === "details" && (
            <div>
              {/* Vehicle */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Vehicle *</label>
                <select className="te-dark-sel" style={inpSel} value={form.vehicleId} onChange={e => selectVehicle(e.target.value)}>
                  <option value="">— Select from available vehicles —</option>
                  {available.map(r => <option key={r._id} value={r._id}>{r.name}{r.vehicleNo ? ` #${r.vehicleNo}` : ""} — {r.price}{r.period}</option>)}
                  <option value="__custom__">Other (type manually)</option>
                </select>
              </div>
              {(form.vehicleId === "__custom__" || !form.vehicleId) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Vehicle Name (manual)</label>
                  <input style={inp} value={form.vehicleName} onChange={e => set("vehicleName", e.target.value)} placeholder="e.g. Honda Activa, Innova Crysta" />
                </div>
              )}

              {/* Vehicle Number */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Vehicle Number</label>
                <input style={inp} value={form.vehicleNumber || ""} onChange={e => set("vehicleNumber", e.target.value)} placeholder="e.g. RJ14 AB 1234" />
              </div>

              {/* Customer */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={lbl}>Customer Full Name *</label>
                  <div style={{position:"relative"}}>
                    <div style={{position:"relative"}}>
                      <input
                        style={{...inp, paddingRight:36}}
                        value={custSearch}
                        onChange={e => searchCustomers(e.target.value)}
                        onFocus={()=> custResults.length > 0 && setCustDropOpen(true)}
                        onBlur={()=> setTimeout(()=>setCustDropOpen(false), 200)}
                        placeholder="Type name or phone to search repeat customers…"
                        autoComplete="off"
                      />
                      {custLoading && <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"rgba(255,255,255,0.3)"}}>⏳</span>}
                      {!custLoading && custSearch && (
                        <span onClick={()=>{setCustSearch("");set("customerName","");setCustDropOpen(false);}}
                          style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"rgba(255,255,255,0.3)",cursor:"pointer"}}>✕</span>
                      )}
                    </div>
                    {custDropOpen && custResults.length > 0 && (
                      <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#0d1b2e",border:"1.5px solid rgba(212,133,10,0.4)",borderRadius:10,zIndex:999,maxHeight:260,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                        <div style={{padding:"8px 14px 4px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:2}}>Repeat customers</div>
                        {custResults.map((b,i) => (
                          <div key={i} onMouseDown={()=>selectCustomer(b)}
                            style={{padding:"10px 14px",cursor:"pointer",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"center"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,133,10,0.1)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(212,133,10,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>👤</div>
                            <div style={{minWidth:0}}>
                              <div style={{fontWeight:600,fontSize:13,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.customerName}</div>
                              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>
                                {b.phone && <span>📞 {b.phone}</span>}
                                {b.vehicleName && <span style={{marginLeft:8}}>🚗 {b.vehicleName}</span>}
                                {b.nationality && <span style={{marginLeft:8}}>🌍 {b.nationality}</span>}
                              </div>
                            </div>
                            <div style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.2)",flexShrink:0}}>
                              {b.checkIn ? new Date(b.checkIn).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : ""}
                            </div>
                          </div>
                        ))}
                        <div style={{padding:"8px 14px",fontSize:11,color:"rgba(255,255,255,0.2)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                          Not listed? Keep typing to add as new customer.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Phone (WhatsApp) *</label>
                  <input style={inp} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 / +965 …" type="tel" />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input style={inp} value={form.email} onChange={e => set("email", e.target.value)} placeholder="Optional" type="email" />
                </div>
              </div>

              {/* Dates + price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Check-in *</label>
                  <input type="date" style={{ ...inp, colorScheme: "dark" }} value={form.checkIn} onChange={e => { set("checkIn", e.target.value); updateConflict(form.vehicleId, e.target.value, form.checkOut); }} />
                </div>
                <div>
                  <label style={lbl}>Check-out *</label>
                  <input type="date" style={{ ...inp, colorScheme: "dark" }} value={form.checkOut} min={form.checkIn || ""} onChange={e => { set("checkOut", e.target.value); updateConflict(form.vehicleId, form.checkIn, e.target.value); }} />
                </div>
                <div>
                  <label style={lbl}>Price per Day (₹)</label>
                  <input type="number" style={inp} value={form.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} placeholder="0" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  {days > 0 && priceNum > 0 && (
                    <div style={{ background: "rgba(212,133,10,0.08)", border: "1px solid rgba(212,133,10,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{days}d × ₹{priceNum.toLocaleString("en-IN")} = </span>
                      <span style={{ color: "#f0c060", fontWeight: 700, fontSize: 18 }}>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Conflict Warning ── */}
              {conflict && (
                <div style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#ff6b6b", fontSize: 13, marginBottom: 4 }}>
                      This vehicle is already booked for these dates!
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      Booked by <strong style={{ color: "white" }}>{conflict.customerName}</strong>
                      {" · "}
                      {new Date(conflict.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" → "}
                      {new Date(conflict.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      <span style={{ marginLeft: 6, background: "rgba(255,80,80,0.2)", padding: "1px 7px", borderRadius: 6, fontSize: 11, textTransform: "capitalize" }}>{conflict.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                      Change the vehicle or adjust the dates to proceed.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Hotel / Stay Address</label>
                <input style={inp} value={form.stayAddress} onChange={e => set("stayAddress", e.target.value)} placeholder="Hotel name, area" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Notes</label>
                <textarea rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any remarks…" />
              </div>

              <button onClick={() => setStep("id")} disabled={!!conflict} style={{ width: "100%", padding: "12px", borderRadius: 10, background: conflict ? "rgba(255,80,80,0.08)" : "rgba(212,133,10,0.15)", border: `1px solid ${conflict ? "rgba(255,80,80,0.3)" : "rgba(212,133,10,0.3)"}`, color: conflict ? "#ff6b6b" : "#f0c060", cursor: conflict ? "not-allowed" : "pointer", fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, opacity: conflict ? 0.6 : 1 }}>
                {conflict ? "⚠️ Resolve conflict to continue" : "Next: Scan Customer ID →"}
              </button>
            </div>
          )}

          {/* ── STEP 2: ID Scan ── */}
          {step === "id" && (
            <div>
              {/* ── Returning customer: ID already on file ── */}
              {form.idImageUrl && !scanDone && !replaceId ? (
                <div>
                  {/* Green banner */}
                  <div style={{padding:"10px 14px",borderRadius:8,background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",color:"#4ade80",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    <span>✅</span>
                    <span>ID already on file for <strong>{form.customerName}</strong> — no re-upload needed.</span>
                  </div>

                  {/* Stored ID preview */}
                  <div style={{marginBottom:16,textAlign:"center",position:"relative"}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Stored ID Document</div>
                    <a href={form.idImageUrl} target="_blank" rel="noreferrer">
                      <img src={form.idImageUrl} alt="Stored ID" style={{maxHeight:180,maxWidth:"100%",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",objectFit:"contain",background:"rgba(0,0,0,0.3)",cursor:"pointer"}}/>
                    </a>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:4}}>Tap image to open full size</div>
                  </div>

                  {/* Stored ID type & number (read-only display) */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                    <div>
                      <label style={lbl}>ID Type</label>
                      <select className="te-dark-sel" style={inpSel} value={form.idType} onChange={e => set("idType", e.target.value)}>
                        <option value="">— Select —</option>
                        {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>ID Number</label>
                      <input style={inp} value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="Document number" />
                    </div>
                  </div>

                  {/* Replace button */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:14,marginBottom:4,textAlign:"center"}}>
                    <button
                      onClick={() => setReplaceId(true)}
                      style={{padding:"9px 22px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.35)",color:"#f87171",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13,fontWeight:600}}
                    >
                      🔄 Replace ID Document
                    </button>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:6}}>Only needed if the customer's ID has changed or expired</div>
                  </div>
                </div>

              ) : form.idImageUrl && replaceId ? (
                /* ── Replace mode: upload new ID, old is removed on save ── */
                <div>
                  <div style={{padding:"10px 14px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span>🔄 Upload a new ID — the old one will be replaced when saved.</span>
                    <button onClick={() => setReplaceId(false)} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:12,whiteSpace:"nowrap"}}>✕ Cancel</button>
                  </div>
                  <ScanPanel
                    customerName={form.customerName}
                    onScanned={(result) => { handleScanned(result); setReplaceId(false); }}
                    onImageUrl={(url) => { set("idImageUrl", url); setReplaceId(false); }}
                    onRemoved={() => { setScanDone(false); set("idImageUrl", ""); }}
                  />
                </div>

              ) : (
                /* ── New customer: no ID on file ── */
                <>
                  <ScanPanel
                    customerName={form.customerName}
                    onScanned={handleScanned}
                    onImageUrl={(url) => set("idImageUrl", url)}
                    onRemoved={() => { setScanDone(false); set("idImageUrl", ""); }}
                  />

                  {scanDone && (
                    <div>
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 12, marginBottom: 14 }}>
                        ✅ Scan complete — review and edit extracted details below
                      </div>
                      <IdFormFields form={form} setForm={setForm} />
                    </div>
                  )}

                  {!scanDone && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 10 }}>— or fill manually —</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>ID Type</label>
                          <select className="te-dark-sel" style={inpSel} value={form.idType} onChange={e => set("idType", e.target.value)}>
                            <option value="">— Select —</option>
                            {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>ID Number</label>
                          <input style={inp} value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="Document number" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep("confirm")} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#d4850a,#f0c060)", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  Next: Confirm →
                </button>
                <button onClick={() => { setScanDone(false); setReplaceId(false); setStep("confirm"); }} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  Skip ID
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === "confirm" && (
            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, marginBottom: 18 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, color: "#f0c060", marginBottom: 14 }}>Booking Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    ["Customer",  form.customerName],
                    ["Phone",     form.phone],
                    ["Vehicle",      form.vehicleName || "—"],
                    form.vehicleNumber ? ["Veh. Number", form.vehicleNumber] : null,
                    ["Dates",     form.checkIn && form.checkOut
                      ? `${new Date(form.checkIn).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} → ${new Date(form.checkOut).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} (${days}d)` : "—"],
                    ["Stay At",   form.stayAddress || "—"],
                    total > 0    ? ["Total",    `₹${total.toLocaleString("en-IN")}`] : null,
                    form.idType  ? ["ID",       `${form.idType} — ${form.idNumber || "—"}`] : null,
                    form.idImageUrl ? ["ID Image", "✅ Uploaded"] : null,
                  ].filter(Boolean).map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#4ade80" }}>
                🏪 Booking will be saved as <strong>Confirmed</strong> and appear with all online bookings instantly.
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6b6b", fontSize: 13, marginBottom: 14 }}>❌ {error}</div>
              )}

              <button onClick={submit} disabled={saving} style={{
                width: "100%", padding: "13px",
                background: "linear-gradient(135deg,#d4850a,#f0c060)",
                color: "#1a1a2e", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 15,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Creating booking…" : "🏪 Confirm Walk-in Booking"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
