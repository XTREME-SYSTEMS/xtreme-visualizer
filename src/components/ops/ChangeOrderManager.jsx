import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, X, FileDiff, Send } from "lucide-react";

const STATUSES = ["draft", "sent", "approved", "rejected"];
const STATUS_COLORS = { draft: "#707070", sent: "#43a9ff", approved: "#f0f40b", rejected: "#ff5258" };

const empty = { project_id: "", title: "", description: "", price_change: 0 };

export default function ChangeOrderManager({ notify }) {
  const [orders, setOrders] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.ChangeOrder.list("-created_date", 50).then(setOrders).catch(() => setOrders([]));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.project_id || !form.title) { notify("Project and title are required"); return; }
    setSaving(true);
    try {
      if (editing === "new") await base44.entities.ChangeOrder.create(form);
      else await base44.entities.ChangeOrder.update(editing, form);
      notify("Change order saved");
      setEditing(null); setForm(empty);
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (o) => { await base44.entities.ChangeOrder.delete(o.id); load(); };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-actionbar">
        <button className="hx-mini-btn" onClick={() => { setEditing("new"); setForm(empty); }}><Plus size={14} /> New Change Order</button>
      </div>
      <div className="hx-list" style={{ maxHeight: 420 }}>
        {!orders ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         orders.length === 0 ? <div className="hx-empty"><span>📝</span>No change orders yet.</div> :
         orders.map((o) => (
           <div key={o.id} className="hx-sys-card" style={{ padding: 12 }}>
             <div className="hx-sys-head">
               <div className="hx-sys-title" style={{ minWidth: 0 }}>
                 <div className="hx-sys-icon"><FileDiff size={16} /></div>
                 <div style={{ minWidth: 0 }}>
                   <strong>{o.title}</strong>
                   <span>{o.price_change ? `$${o.price_change.toLocaleString()}` : "No cost change"} · {o.description?.slice(0, 60) || ""}</span>
                 </div>
               </div>
               <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                 <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: STATUS_COLORS[o.status] || "#707070", border: `1px solid ${STATUS_COLORS[o.status] || "#707070"}` }}>{o.status}</span>
                 <button className="hx-lead-delete" onClick={() => remove(o)}><Trash2 size={13} /></button>
               </div>
             </div>
           </div>
         ))}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">Change Order</div><h2 style={{ fontSize: 18 }}>New Change Order</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Project ID</label><input value={form.project_id} onChange={(e) => set("project_id", e.target.value)} placeholder="Project ID" /></div>
              <div className="field"><label>Title</label><input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
              <div className="field"><label>Description</label><textarea className="hx-bid-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="field"><label>Price change ($)</label><input type="number" value={form.price_change} onChange={(e) => set("price_change", Number(e.target.value))} /></div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Save & Send for e-Sign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}