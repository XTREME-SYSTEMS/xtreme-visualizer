import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CreditCard, CheckCircle2, Clock, Camera, FileText, MapPin, Ruler, Palette, DollarSign } from "lucide-react";

export default function CustomerPortal() {
  const { leadId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("getCustomerPortal", { lead_id: leadId });
        const d = res.data || res;
        if (d.error) setError(d.error);
        else setData(d);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || "Failed to load portal");
      }
    };
    load();
  }, [leadId]);

  if (error) return <div style={{ padding: 40, textAlign: "center", color: "var(--vx-danger)" }}><h2>Unable to load</h2><p>{error}</p></div>;
  if (!data) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Loader2 size={24} className="spin" style={{ color: "var(--vx-accent)" }} /></div>;

  const { lead, photos, invoices } = data;
  const beforePhotos = photos.filter((p) => p.category === "site_before");
  const afterPhotos = photos.filter((p) => p.category === "site_after");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 16, background: "var(--vx-bg)", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <h1 style={{ fontSize: 24, color: "var(--vx-text)", margin: "0 0 4px" }}>{lead.customer_name}'s Project</h1>
        <p style={{ color: "var(--vx-muted)", fontSize: 14, margin: 0 }}>{lead.project_address || "Project Portal"}</p>
      </div>

      <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h2 style={{ fontSize: 16, color: "var(--vx-accent)", margin: 0 }}>Project Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--vx-muted)" }}><MapPin size={14} /> {lead.space_type?.replace(/_/g, " ") || "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--vx-muted)" }}><Ruler size={14} /> {lead.square_feet ? `${lead.square_feet} sq ft` : "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--vx-muted)" }}><Palette size={14} /> {lead.color_name || lead.floor_type || "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--vx-muted)" }}><DollarSign size={14} /> {lead.proposal_total ? `$${lead.proposal_total.toLocaleString()}` : lead.estimate_low ? `$${lead.estimate_low.toLocaleString()}–$${lead.estimate_high?.toLocaleString()}` : "—"}</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6, alignSelf: "start", color: "var(--vx-accent)", border: "1px solid var(--vx-accent)", textTransform: "capitalize" }}>{lead.status.replace(/_/g, " ")}</div>
      </div>

      {lead.specifications?.length > 0 && (
        <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h2 style={{ fontSize: 16, color: "var(--vx-accent)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><FileText size={16} /> Scope of Work</h2>
          {lead.specifications.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--vx-accent)", color: "#000", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>{i + 1}</div>
              <div><strong style={{ fontSize: 13, color: "var(--vx-text)" }}>{s.label}</strong>{s.detail && <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: "2px 0 0" }}>{s.detail}</p>}</div>
            </div>
          ))}
        </div>
      )}

      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h2 style={{ fontSize: 16, color: "var(--vx-accent)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Camera size={16} /> Project Photos</h2>
          {beforePhotos.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: "0 0 6px" }}>Before</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {beforePhotos.map((p, i) => <img key={i} src={p.file_url} alt="Before" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--vx-border-soft)" }} />)}
              </div>
            </div>
          )}
          {afterPhotos.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: "0 0 6px" }}>After</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {afterPhotos.map((p, i) => <img key={i} src={p.file_url} alt="After" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--vx-border-soft)" }} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h2 style={{ fontSize: 16, color: "var(--vx-accent)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={16} /> Invoices</h2>
          {invoices.map((inv) => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
              <div>
                <strong style={{ fontSize: 13, color: "var(--vx-text)" }}>{inv.type === "deposit" ? "Deposit" : "Final Payment"}</strong>
                <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: "2px 0 0" }}>${inv.amount.toLocaleString()} · {inv.description}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: inv.status === "paid" ? "var(--vx-accent)" : "var(--vx-warning)", border: `1px solid ${inv.status === "paid" ? "var(--vx-accent)" : "var(--vx-warning)"}` }}>
                  {inv.status === "paid" ? <CheckCircle2 size={10} style={{ display: "inline", marginRight: 3 }} /> : <Clock size={10} style={{ display: "inline", marginRight: 3 }} />}
                  {inv.status}
                </span>
                {inv.status !== "paid" && inv.checkout_url && (
                  <a href={inv.checkout_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 6, background: "var(--vx-accent)", color: "#000", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CreditCard size={11} /> Pay Now
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lead.signature_url && (
        <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h2 style={{ fontSize: 16, color: "var(--vx-accent)", margin: 0 }}>Signed Proposal</h2>
          <img src={lead.signature_url} alt="Customer signature" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 8, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }} />
          {lead.signed_date && <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: 0 }}>Signed on {new Date(lead.signed_date).toLocaleDateString()}</p>}
        </div>
      )}
    </div>
  );
}