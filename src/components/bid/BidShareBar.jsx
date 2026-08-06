import React, { useState } from "react";
import { Mail, MessageSquare, Share2, Copy, Check } from "lucide-react";

export default function BidShareBar({ bidText }) {
  const [copied, setCopied] = useState(false);
  const shareText = encodeURIComponent(bidText.slice(0, 1500));
  const smsLink = `sms:?&body=${shareText}`;
  const waLink = `https://wa.me/?text=${shareText}`;
  const mailLink = `mailto:?subject=Your Flooring Proposal — Xtreme Polishing Systems&body=${encodeURIComponent(bidText)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bidText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="hx-bid-share">
      <a className="hx-bid-share-btn" href={mailLink}>
        <Mail size={18} />
        <span>Email</span>
      </a>
      <a className="hx-bid-share-btn" href={smsLink}>
        <MessageSquare size={18} />
        <span>SMS</span>
      </a>
      <a className="hx-bid-share-btn" href={waLink} target="_blank" rel="noreferrer">
        <Share2 size={18} />
        <span>WhatsApp</span>
      </a>
      <button className="hx-bid-share-btn" onClick={copy}>
        {copied ? <Check size={18} /> : <Copy size={18} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}