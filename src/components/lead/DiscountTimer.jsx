import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function DiscountTimer({ expiresAt, discountAmount, discountPct }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  if (!expiresAt || remaining === null) return null;

  const expired = remaining === 0;
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 10,
      background: expired ? "rgba(255,82,88,.08)" : "rgba(156,255,0,.08)",
      border: `1px solid ${expired ? "var(--vx-danger)" : "var(--vx-accent)"}`,
    }}>
      <Clock size={16} style={{ color: expired ? "var(--vx-danger)" : "var(--vx-accent)" }} />
      <div>
        <strong style={{ fontSize: 12, color: expired ? "var(--vx-danger)" : "var(--vx-accent)" }}>
          {expired ? "Discount expired" : "Discount offer ends in"}
        </strong>
        {!expired && (
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--vx-text)", fontVariantNumeric: "tabular-nums" }}>
            {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        )}
        {discountAmount > 0 && (
          <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: 0 }}>
            Save ${discountAmount.toLocaleString()}{discountPct > 0 ? ` (${discountPct}% off)` : ""}
          </p>
        )}
      </div>
    </div>
  );
}