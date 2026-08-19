import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, X, HardHat, Save } from "lucide-react";

const empty = { name: "", company: "", email: "", phone: "", trade: "", rating: 5, active: true, notes: "" };

export default function SubcontractorManager({ notify }) {
  const [subs, setSubs] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.Subcontractor.list("-created_date", 50).then(setSubs).catch(() => setSubs([]));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) { notify("Name is required"); return; }
    setSaving(true);
    try {
      if (editing === "new") await base44.entities.Subcontractor.create(form);
      else await base44.entities.Subcontractor.update(editing, form);
      notify("Subcontractor saved");
      setEditing(null); setForm(empty);
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (s) => { await base44.entities.Subcontractor.delete(s.id); load(); };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-actionbar">
        <button className="hx-mini-btn" onClick={() => { setEditing("new"); setForm(empty); }}><Plus size={14} /> New Subcontractor</button>
      </div>
      <div className="hx-list" style={{ maxHeight: 420 }}>
        {!subs ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         subs.length === 0 ? <div className="hx-empty"><span>👷</span>No subcontractors yet.</div> :
         subs.map((s) => (
           <div key={s.id} className="hx-sys-card" style={{ padding: 12 }}>
             <div className="hx-sys-head">
               <div className="hx-sys-title" style={{ minWidth: 0 }}>
                 <div className="hx-sys-icon"><HardHat size={16} /></div>
                 <div style={{ minWidth: 0 }}>
                   <strong>{s.name}</strong>
                   <span>{s.trade || "Trade"} · {s.company || ""} · ⭐ {s.rating}</span>
                 </div>
               </div>
               <button className="hx-lead-delete" onClick={() => remove(s)}><Trash2 size={13} /></button>
             </div>
             {(s.phone || s.email) && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#A0A0A0" }}>{s.phone}{s.phone && s.email ? " · " : ""}{s.email}</p>}
           </div>
         ))}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">Subcontractor</div><h2 style={{ fontSize: 18 }}>New Subcontractor</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="form-grid two">
                <div className="field"><label>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
                <div className="field"><label>Company</label><input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Trade</label><input value={form.trade} onChange={(e) => set("trade", e.target.value)} placeholder="Epoxy Installer, Polishing…" /></div>
                <div className="field"><label>Rating (1-5)</label><input type="number" min="1" max="5" value={form.rating} onChange={(e) => set("rating", Number(e.target.value))} /></div>
              </div>
              <div className="field"><label>Notes</label><textarea className="hx-bid-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save Subcontractor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}