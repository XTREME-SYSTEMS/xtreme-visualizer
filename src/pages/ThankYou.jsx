import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ThankYou() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const invoiceId = params.get("invoice") || "";

  return (
    <div className="vx-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "var(--vx-bg)" }}>
      <div style={{ transform: show ? "scale(1)" : "scale(0.6)", opacity: show ? 1 : 0, transition: "all .5s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", border: "2px solid var(--vx-accent)", background: "var(--vx-accent-soft)", display: "grid", placeItems: "center", margin: "0 auto 22px", boxShadow: "var(--vx-glow)" }}>
          <CheckCircle2 size={44} style={{ color: "var(--vx-accent)" }} />
        </div>
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 8px", color: "var(--vx-text)" }}>Payment Received</h1>
      <p style={{ fontSize: 14, color: "var(--vx-muted)", maxWidth: 340, lineHeight: 1.5, margin: "0 0 28px" }}>
        Thank you! Your payment has been processed successfully. A receipt has been sent to your email.
      </p>
      <button className="hx-mini-btn" onClick={() => navigate("/")} style={{ textDecoration: "none" }}>
        <ArrowLeft size={15} /> Back to App
      </button>
    </div>
  );
}