import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, RefreshCw, X, Send, CheckCircle2 } from "lucide-react";

const PLANS = [
  { name: "Annual Sealer Maintenance", price: 299, frequency: "YEAR" },
  { name: "Quarterly Inspection Plan", price: 89, frequency: "MONTH" },
  { name: "Premium Care + Reseal", price: 499, frequency: "YEAR" },
];

const STATUS_STYLE = {
  pending: { color: "#ffd200", bg: "rgba(255,210,0,.08)" },
  active: { color: "var(--vx-accent)", bg: "var(--vx-accent-soft)" },
  canceled: { color: "var(--vx-danger)", bg: "rgba(255,82,88,.08)" },
  expired: { color: "#707070", bg: "var(--vx-panel)" },
};

export default function MaintenanceSubscriptions({ leads, workOrders, notify }) {
  const [subs, setSubs] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(null);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", lead_id: "", plan_name: PLANS[0].name, price: PLANS[0].price, frequency: PLANS[0].frequency });

  const load = async () => {
    try {
      setSubs(await base44.entities.MaintenanceSubscription.list("-created_date", 50));
    } catch { setSubs([]); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pickPlan = (planName) => {
    const plan = PLANS.find((p) => p.name === planName);
    if (plan) setForm((p) => ({ ...p, plan_name: plan.name, price: plan.price, frequency: plan.frequency }));
  };

  const pickLead = (id) => {
    const lead = leads.find((l) => l.id === id);
    if (lead) setForm((p) => ({ ...p, lead_id: id, customer_name: lead.customer_name || p.customer_name, customer_email: lead.email || p.customer_email }));
    else set("lead_id", id);
  };

  const create = async () => {
    if (!form.customer_name) { notify("Customer name required"); return; }
    if (!form.price || form.price < 0.5) { notify("Price must be at least $0.50"); return; }
    try {
      await base44.entities.MaintenanceSubscription.create({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        lead_id: form.lead_id || null,
        plan_name: form.plan_name,
        price: Number(form.price),
        frequency: form.frequency,
        status: "pending",
      });
      notify("Maintenance plan created — charge to start subscription");
      setShowForm(false);
      load();
    } catch (e) { notify("Create failed: " + e.message); }
  };

  const charge = async (sub) => {
    setBusy(sub.id);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: sub.id, productType: "maintenance" });
      const data = res.data || res;
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        notify("Checkout failed: " + (data.error || "no redirect URL"));
        setBusy(null);
      }
    } catch (e) {
      notify("Checkout failed: " + (e?.response?.data?.error || e.message));
      setBusy(null);
    }
  };

  const remove = async (sub) => {
    if (sub.status === "active") { notify("Can't delete an active subscription — cancel from Wix first"); return; }
    await base44.entities.MaintenanceSubscription.delete(sub.id);
    load();
  };

  const totalActive = (subs || []).filter((s) => s.status === "active").length;
  const mrr = (subs || []).filter((s) => s.status === "active" && s.frequency === "MONTH").reduce((sum, s) => sum + s.price, 0);
  const arr = (subs || []).filter((s) => s.status === "active" && s.frequency === "YEAR").reduce((sum, s) => sum + s.price, 0);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-page-head" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: 16, margin: 0 }}>Maintenance Subscriptions</h2>
          <p style={{ fontSize: 12, margin: "2px 0 0" }}>Recurring revenue from annual sealer coats and inspection plans.</p>
        </div>
        <button className="hx-mini-btn" onClick={() => setShowForm(true)}><Plus size={14} /> New Plan</button>
      </div>

      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="hx-stat"><RefreshCw size={14} /><strong>{totalActive}</strong><span>Active</span></div>
        <div className="hx-stat"><span style={{ fontSize: 10 }}>/mo</span><strong>${mrr.toLocaleString()}</strong><span>MRR</span></div>
        <div className="hx-stat"><span style={{ fontSize: 10 }}>/yr</span><strong>${arr.toLocaleString()}</strong><span>ARR</span></div>
      </div>

      <div className="hx-list">
        {!subs ? <div className="hx-loading"><Loader2 className="spin" size={18} /></div> :
         subs.length === 0 ? <div className="hx-empty"><span>🔄</span>No maintenance subscriptions yet. Offer annual plans to past customers for recurring revenue.</div> :
         subs.map((s) => {
           const st = STATUS_STYLE[s.status] || STATUS_STYLE.pending;
           return (
            <div key={s.id} className="hx-sys-card" style={{ padding: 12 }}>
              <div className="hx-sys-head">
                <div className="hx-sys-title" style={{ minWidth: 0 }}>
                  <div className="hx-sys-icon"><RefreshCw size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <strong>{s.plan_name}</strong>
                    <span>{s.customer_name} · ${s.price}/{s.frequency === "YEAR" ? "yr" : "mo"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: st.color, border: `1px solid ${st.color}`, background: st.bg }}>{s.status}</span>
                  {s.status !== "active" && <button className="hx-lead-delete" onClick={() => remove(s)}><Trash2 size={13} /></button>}
                </div>
              </div>
              <div className="hx-bid-controls" style={{ marginTop: 8 }}>
                {s.status === "pending" && (
                  <button className="gold-button" style={{ justifyContent: "center", flex: 1 }} onClick={() => charge(s)} disabled={busy === s.id}>
                    {busy === s.id ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Start Subscription
                  </button>
                )}
                {s.status === "active" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--vx-accent)", fontSize: 12, fontWeight: 700, flex: 1, justifyContent: "center" }}>
                    <CheckCircle2 size={14} /> Active {s.activated_at ? `since ${new Date(s.activated_at).toLocaleDateString()}` : ""}
                  </div>
                )}
              </div>
            </div>
          );
         })}
      </div>

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-head">
              <div><div className="eyebrow">Recurring Revenue</div><h2 style={{ fontSize: 18 }}>New Maintenance Plan</h2></div>
              <button className="close-button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Plan Template</label>
                <select value={form.plan_name} onChange={(e) => pickPlan(e.target.value)}>
                  {PLANS.map((p) => <option key={p.name} value={p.name}>{p.name} — ${p.price}/{p.frequency === "YEAR" ? "yr" : "mo"}</option>)}
                </select>
              </div>
              <div className="field"><label>Link to Lead (optional)</label>
                <select value={form.lead_id} onChange={(e) => pickLead(e.target.value)}>
                  <option value="">— None —</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.customer_name}{l.project_address ? ` · ${l.project_address}` : ""}</option>)}
                </select>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Customer Name</label><input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></div>
                <div className="field"><label>Customer Email</label><input value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} /></div>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Price (USD)</label><input type="number" min="0.5" step="0.01" value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
                <div className="field"><label>Billing Frequency</label>
                  <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)}>
                    <option value="YEAR">Yearly</option>
                    <option value="MONTH">Monthly</option>
                  </select>
                </div>
              </div>
              <button className="gold-button form-submit" onClick={create}><Plus size={15} /> Create Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}