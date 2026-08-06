import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Check, X, ListChecks } from "lucide-react";

const DEFAULT_STEPS = [
  "Job folder created in Drive",
  "Materials ordered & delivered",
  "Crew assigned & scheduled",
  "Site prep complete",
  "Primer applied",
  "Base coat applied",
  "Color install complete",
  "Topcoat applied",
  "Final walkthrough & punch list",
  "Invoice sent",
];

export default function ProjectTimeline({ notify }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => { setOrders(await base44.entities.WorkOrder.list("-created_date", 50)); };
  const loadSteps = async (id) => { setLoading(true); const s = await base44.entities.ProjectStep.filter({ work_order_id: id }); s.sort((a, b) => (a.step_order || 0) - (b.step_order || 0)); setSteps(s); setLoading(false); };

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { if (selected) loadSteps(selected); }, [selected]);

  const addDefault = async () => {
    for (let i = 0; i < DEFAULT_STEPS.length; i++) await base44.entities.ProjectStep.create({ work_order_id: selected, label: DEFAULT_STEPS[i], step_order: i });
    loadSteps(selected);
    notify("Timeline steps added");
  };

  const add = async () => {
    if (!newStep.trim()) return;
    await base44.entities.ProjectStep.create({ work_order_id: selected, label: newStep.trim(), step_order: steps.length });
    setNewStep("");
    loadSteps(selected);
  };

  const toggle = async (s) => { await base44.entities.ProjectStep.update(s.id, { done: !s.done, completed_at: !s.done ? new Date().toISOString() : null }); loadSteps(selected); };
  const remove = async (s) => { await base44.entities.ProjectStep.delete(s.id); loadSteps(selected); };

  const progress = steps.length > 0 ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100) : 0;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-form" style={{ padding: 12 }}>
        <label style={{ fontSize: 12, color: "var(--vx-muted)", fontWeight: 700 }}>Select Work Order</label>
        <select className="hx-scraper-input" value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose a work order…</option>
          {orders.map((o) => <option key={o.id} value={o.id}>{o.customer_name || "Untitled"}</option>)}
        </select>
      </div>

      {selected && (
        <>
          <div className="hx-scraper-actionbar">
            <button className="hx-mini-btn dark" onClick={addDefault}><Plus size={14} /> Default Timeline</button>
          </div>

          {steps.length > 0 && (
            <div className="hx-sys-card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><ListChecks size={14} /> Progress</strong>
                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--vx-accent)" }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: "var(--vx-panel-3)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--vx-accent)", transition: "width .3s" }} />
              </div>
            </div>
          )}

          {loading ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
          <div className="hx-list" style={{ maxHeight: 300 }}>
            {steps.length === 0 ? <div className="hx-empty"><span>📋</span>No timeline steps yet.</div> :
            steps.map((s, i) => (
              <div key={s.id} className="hx-sys-card" style={{ padding: 10, display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900, color: s.done ? "#061000" : "var(--vx-faint)", background: s.done ? "var(--vx-accent)" : "var(--vx-panel-3)" }}>{s.done ? <Check size={14} /> : i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 13, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--vx-muted)" : "#fff", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</strong>
                  {s.completed_at && <span style={{ fontSize: 10, color: "var(--vx-faint)" }}>{new Date(s.completed_at).toLocaleDateString()}</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="hx-lead-delete" onClick={() => toggle(s)} style={{ color: s.done ? "var(--vx-accent)" : "var(--vx-faint)", borderColor: s.done ? "var(--vx-accent)" : "var(--vx-border-soft)" }}><Check size={13} /></button>
                  <button className="hx-lead-delete" onClick={() => remove(s)}><X size={13} /></button>
                </div>
              </div>
            ))}
          </div>}

          <div className="hx-scraper-form" style={{ padding: 12 }}>
            <div className="hx-scraper-row">
              <input className="hx-scraper-input" placeholder="Add timeline step…" value={newStep} onChange={(e) => setNewStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
              <button className="hx-bid-logo-btn" onClick={add}><Plus size={13} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}