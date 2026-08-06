import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, X, DollarSign, Save } from "lucide-react";

const empty = { project_id: "", material_cost: 0, labor_cost: 0, fuel_cost: 0, consumables_cost: 0, other_cost: 0, predicted_total: 0, material_overage_pct: 30 };

export default function JobCostManager({ notify }) {
  const [costs, setCosts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.JobCost.list("-created_date", 50).then(setCosts).catch(() => setCosts([]));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const actualTotal = (form.material_cost + form.labor_cost + form.fuel_cost + form.consumables_cost + form.other_cost);

  const save = async () => {
    if (!form.project_id) { notify("Project ID is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, actual_total: actualTotal };
      if (editing === "new") await base44.entities.JobCost.create(payload);
      else await base44.entities.JobCost.update(editing, payload);
      notify("Job cost saved");
      setEditing(null); setForm(empty);
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (c) => { await base44.entities.JobCost.delete(c.id); load(); };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-actionbar">
        <button className="hx-mini-btn" onClick={() => { setEditing("new"); setForm(empty); }}><Plus size={14} /> New Job Cost</button>
      </div>
      <div className="hx-list" style={{ maxHeight: 420 }}>
        {!costs ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         costs.length === 0 ? <div className="hx-empty"><span>💰</span>No job costs tracked yet.</div> :
         costs.map((c) => {
           const actual = (c.material_cost || 0) + (c.labor_cost || 0) + (c.fuel_cost || 0) + (c.consumables_cost || 0) + (c.other_cost || 0);
           return (
             <div key={c.id} className="hx-sys-card" style={{ padding: 12 }}>
               <div className="hx-sys-head">
                 <div className="hx-sys-title" style={{ minWidth: 0 }}>
                   <div className="hx-sys-icon"><DollarSign size={16} /></div>
                   <div style={{ minWidth: 0 }}>
                     <strong>Project {c.project_id?.slice(-6) || "—"}</strong>
                     <span>Predicted: ${c.predicted_total?.toLocaleString() || 0} · Actual: ${actual.toLocaleString()}</span>
                   </div>
                 </div>
                 <button className="hx-lead-delete" onClick={() => remove(c)}><Trash2 size={13} /></button>
               </div>
             </div>
           );
         })}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">Job Cost</div><h2 style={{ fontSize: 18 }}>Track Job Cost</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Project ID</label><input value={form.project_id} onChange={(e) => set("project_id", e.target.value)} /></div>
              <div className="field"><label>Predicted total ($)</label><input type="number" value={form.predicted_total} onChange={(e) => set("predicted_total", Number(e.target.value))} /></div>
              <div className="form-grid two">
                <div className="field"><label>Material ($)</label><input type="number" value={form.material_cost} onChange={(e) => set("material_cost", Number(e.target.value))} /></div>
                <div className="field"><label>Labor ($)</label><input type="number" value={form.labor_cost} onChange={(e) => set("labor_cost", Number(e.target.value))} /></div>
                <div className="field"><label>Fuel ($)</label><input type="number" value={form.fuel_cost} onChange={(e) => set("fuel_cost", Number(e.target.value))} /></div>
                <div className="field"><label>Consumables ($)</label><input type="number" value={form.consumables_cost} onChange={(e) => set("consumables_cost", Number(e.target.value))} /></div>
                <div className="field"><label>Other ($)</label><input type="number" value={form.other_cost} onChange={(e) => set("other_cost", Number(e.target.value))} /></div>
                <div className="field"><label>Material overage (%)</label><input type="number" value={form.material_overage_pct} onChange={(e) => set("material_overage_pct", Number(e.target.value))} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "var(--vx-accent-soft)", border: "1px solid var(--vx-accent)" }}>
                <span style={{ fontSize: 12, color: "#A0A0A0" }}>Actual total</span>
                <strong style={{ color: "var(--vx-accent)", fontSize: 18 }}>${actualTotal.toLocaleString()}</strong>
              </div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save Job Cost
            </button>
          </div>
        </div>
      )}
    </div>
  );
}