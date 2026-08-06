import React, { useState } from "react";
import { MessageSquare, Mail, Share2, Copy, Check } from "lucide-react";

export default function VideoShareBar({ url, title }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — ${url}`;

  const share = (channel) => {
    if (channel === "sms") window.open(`sms:?&body=${encodeURIComponent(text)}`, "_blank");
    else if (channel === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (channel === "email") window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
    else if (channel === "native" && navigator.share) navigator.share({ title, text, url });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)", color: "var(--vx-text)", fontSize: 12, cursor: "pointer" };

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--vx-faint)", marginBottom: 8 }}>Share</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => share("sms")}><MessageSquare size={14} /> SMS</button>
        <button style={btn} onClick={() => share("whatsapp")}><MessageSquare size={14} /> WhatsApp</button>
        <button style={btn} onClick={() => share("email")}><Mail size={14} /> Email</button>
        {navigator.share && <button style={btn} onClick={() => share("native")}><Share2 size={14} /> More</button>}
        <button style={btn} onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}</button>
      </div>
    </div>
  );
}