import React from "react";
import { Layers, Power, Pencil } from "lucide-react";

const CATEGORY_LABEL = {
  epoxy: "Epoxy",
  polished_concrete: "Polished Concrete",
  decorative_concrete: "Decorative Concrete",
  coating: "Coating",
  specialty: "Specialty",
};

export default function SystemCard({ system, onEdit, onToggle }) {
  const active = system.active !== false;
  const colors = system.colors || [];
  const finishes = system.finishes || [];

  return (
    <div className="hx-sys-card">
      <div className="hx-sys-head">
        <div className="hx-sys-title">
          <div className="hx-sys-icon"><Layers size={16} /></div>
          <div style={{ minWidth: 0 }}>
            <strong>{system.name}</strong>
            <span>{CATEGORY_LABEL[system.category] || (system.category || "").replace(/_/g, " ")}</span>
          </div>
        </div>
        <button className={`hx-sys-toggle ${active ? "on" : "off"}`} onClick={onToggle}>
          <Power size={13} /> {active ? "Active" : "Off"}
        </button>
      </div>

      {system.description && <p className="hx-sys-desc">{system.description}</p>}

      <div className="hx-sys-rate">
        ${system.base_rate_low} – ${system.base_rate_high}
        <small> / sq ft</small>
      </div>

      {colors.length > 0 && (
        <div className="hx-sys-swatches">
          {colors.map((c) => (
            <span key={c.name} className="hx-sys-swatch" style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
      )}

      {finishes.length > 0 && (
        <div className="hx-sys-chips">
          {finishes.map((f) => (
            <span key={f} className="hx-sys-chip">{f}</span>
          ))}
        </div>
      )}

      <button className="hx-sys-edit" onClick={onEdit}>
        <Pencil size={14} /> Edit system
      </button>
    </div>
  );
}