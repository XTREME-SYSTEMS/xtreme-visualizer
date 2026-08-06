import React, { useState } from "react";
import { X } from "lucide-react";

const CATEGORIES = ["epoxy", "polished_concrete", "decorative_concrete", "coating", "specialty"];

export default function SystemEditor({ draft, onClose, onSave }) {
  const [form, setForm] = useState(draft);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">{form.id ? "Edit system" : "New system"}</div>
            <h2 style={{ fontSize: 18 }}>{form.name || "Floor System"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-grid">
          <label className="field">Name
            <input className="vx-input" value={form.name || ""} onChange={set("name")} placeholder="e.g. Metallic Epoxy Premium" />
          </label>
          <label className="field">Category
            <select className="vx-input" value={form.category || "epoxy"} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">Base rate low ($/sqft)
            <input className="vx-input" type="number" value={form.base_rate_low || ""} onChange={set("base_rate_low")} />
          </label>
          <label className="field">Base rate high ($/sqft)
            <input className="vx-input" type="number" value={form.base_rate_high || ""} onChange={set("base_rate_high")} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>Finishes (comma separated)
            <input className="vx-input" value={form.finishesText || ""} onChange={set("finishesText")} placeholder="Matte, Satin, High Gloss" />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>Colors (Name:#hex, comma separated)
            <input className="vx-input" value={form.colorsText || ""} onChange={set("colorsText")} placeholder="Charcoal:#222222, Silver:#cccccc" />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>Description
            <textarea className="vx-input" rows={2} value={form.description || ""} onChange={set("description")} />
          </label>
        </div>

        <div className="vx-grid vx-grid-2" style={{ marginTop: 16 }}>
          <button className="vx-btn" onClick={onClose}>Cancel</button>
          <button className="vx-btn primary" disabled={!form.name} onClick={() => onSave(form)}>Save system</button>
        </div>
      </div>
    </div>
  );
}