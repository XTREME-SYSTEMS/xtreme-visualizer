import React from "react";
import { QrCode } from "lucide-react";

export default function QrGenerator({ qrData, setQrData }) {
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(qrData)}` : "";

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><QrCode size={15} /> QR Code Generator</div>
      <input className="hx-scraper-input" placeholder="URL, contact info, or vCard text" value={qrData} onChange={(e) => setQrData(e.target.value)} />
      {qrUrl && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "#fff" }}>
          <img src={qrUrl} alt="QR code" style={{ width: 90, height: 90, borderRadius: 8 }} />
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 12, color: "#111" }}>Scan-ready QR</strong>
            <span style={{ fontSize: 10, color: "#666", wordBreak: "break-all" }}>{qrData.slice(0, 60)}{qrData.length > 60 ? "…" : ""}</span>
            <a href={qrUrl} download="qr-code.png" style={{ fontSize: 11, color: "#000", fontWeight: 700 }}>Download ↓</a>
          </div>
        </div>
      )}
    </div>
  );
}