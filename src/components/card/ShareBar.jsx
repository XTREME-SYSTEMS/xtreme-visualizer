import React, { useState } from "react";
import { Mail, MessageSquare, Copy, Check, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ShareBar({ assetName, assetId, shareText, qrData, notify }) {
  const [copied, setCopied] = useState(false);
  const text = shareText || assetName || "Check out my business";
  const link = qrData && qrData.startsWith("http") ? qrData : "";

  const log = async (channel) => {
    try {
      await base44.entities.TrackingEvent.create({ event_type: "share_clicked", asset_id: assetId, asset_name: assetName, channel });
    } catch {}
  };

  const email = () => {
    log("email");
    window.location.href = `mailto:?subject=${encodeURIComponent(assetName || "My Business")}&body=${encodeURIComponent(text + (link ? "\n\n" + link : ""))}`;
  };
  const sms = () => {
    log("sms");
    window.location.href = `sms:?&body=${encodeURIComponent(text + (link ? " " + link : ""))}`;
  };
  const whatsapp = () => {
    log("whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(text + (link ? " " + link : ""))}`, "_blank");
  };
  const copy = async () => {
    log("copy");
    try { await navigator.clipboard.writeText(text + (link ? "\n" + link : "")); setCopied(true); setTimeout(() => setCopied(false), 2000); notify && notify("Copied to clipboard"); } catch {}
  };

  return (
    <div className="hx-bid-share">
      <button className="hx-bid-share-btn" onClick={email}><Mail size={18} /><span>Email</span></button>
      <button className="hx-bid-share-btn" onClick={sms}><MessageSquare size={18} /><span>SMS</span></button>
      <button className="hx-bid-share-btn" onClick={whatsapp}><Share2 size={18} /><span>WhatsApp</span></button>
      <button className="hx-bid-share-btn" onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}<span>{copied ? "Copied" : "Copy"}</span></button>
    </div>
  );
}