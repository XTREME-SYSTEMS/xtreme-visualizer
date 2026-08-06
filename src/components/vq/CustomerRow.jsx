import React from "react";
import { money } from "@/lib/pricing";

const STATUS_TONE = {
  new: { bg: "var(--vx-accent-soft)", color: "var(--vx-accent)", border: "var(--vx-accent)" },
  qualified: { bg: "rgba(67,169,255,.12)", color: "var(--vx-info)", border: "var(--vx-info)" },
  estimate_sent: { bg: "rgba(255,208,0,.12)", color: "var(--vx-warning)", border: "var(--vx-warning)" },
  proposal_sent: { bg: "rgba(67,169,255,.12)", color: "var(--vx-info)", border: "var(--vx-info)" },
  follow_up: { bg: "rgba(255,208,0,.12)", color: "var(--vx-warning)", border: "var(--vx-warning)" },
  won: { bg: "rgba(156,255,0,.14)", color: "var(--vx-accent)", border: "var(--vx-accent)" },
  lost: { bg: "rgba(255,82,88,.12)", color: "var(--vx-danger)", border: "var(--vx-danger)" },
};

function initials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function CustomerRow({ lead, onClick }) {
  const tone = STATUS_TONE[lead.status] || STATUS_TONE.new;
  const range = lead.proposal_total
    ? money(lead.proposal_total)
    : lead.estimate_low && lead.estimate_high
      ? `${money(lead.estimate_low)} – ${money(lead.estimate_high)}`
      : "—";
  const created = lead.created_date ? new Date(lead.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <div className="home-bid-row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <button className="home-bid-main" style={{ background: "transparent", border: 0, cursor: "inherit" }}>
        <div className="home-bid-thumb" style={{ borderRadius: "50%", border: "1px solid var(--vx-accent)", background: "var(--vx-accent-soft)", color: "var(--vx-accent)", fontWeight: 800, fontSize: 14 }}>
          {lead.photo_url ? <img src={lead.photo_url} alt="" /> : initials(lead.customer_name)}
        </div>
        <div className="home-bid-info">
          <strong>{lead.customer_name || "Untitled customer"}</strong>
          <small>{[lead.email, lead.phone].filter(Boolean).join(" · ") || lead.project_address || "No contact info"}</small>
          <small style={{ color: "var(--vx-faint)" }}>
            {lead.system_name || lead.floor_type || "System TBD"}
            {lead.square_feet ? ` · ${Number(lead.square_feet).toLocaleString()} sq ft` : ""}
            {lead.source ? ` · ${lead.source.replace(/_/g, " ")}` : ""}
          </small>
        </div>
      </button>
      <div style={{ display: "grid", gap: 4, justifyItems: "end", flexShrink: 0 }}>
        <span className="home-bid-range">{range}</span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
          padding: "3px 8px", borderRadius: 6,
          background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`,
        }}>
          {(lead.status || "new").replace(/_/g, " ")}
        </span>
        <span style={{ fontSize: 10, color: "var(--vx-faint)" }}>{created}</span>
      </div>
    </div>
  );
}