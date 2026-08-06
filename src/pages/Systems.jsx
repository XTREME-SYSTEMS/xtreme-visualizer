import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus } from "lucide-react";
import SystemCard from "@/components/systems/SystemCard";
import SystemEditor from "@/components/systems/SystemEditor";

const CATEGORIES = ["All", "epoxy", "polished_concrete", "decorative_concrete", "coating", "specialty"];

export default function Systems() {
  const [systems, setSystems] = useState(null);
  const [draft, setDraft] = useState(null);
  const [filter, setFilter] = useState("All");

  const load = () => base44.entities.FloorSystem.list("-created_date", 100).then(setSystems);
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    const payload = {
      name: form.name,
      category: form.category || "epoxy",
      description: form.description || "",
      finishes: (form.finishesText || "").split(",").map((s) => s.trim()).filter(Boolean),
      colors: (form.colorsText || "").split(",").map((s) => s.trim()).filter(Boolean).map((pair) => {
        const [n, hex] = pair.split(":").map((x) => x.trim());
        return { name: n, hex: hex || "#888888" };
      }),
      base_rate_low: Number(form.base_rate_low) || 0,
      base_rate_high: Number(form.base_rate_high) || 0,
      active: form.active !== false,
    };
    if (form.id) await base44.entities.FloorSystem.update(form.id, payload);
    else await base44.entities.FloorSystem.create(payload);
    setDraft(null);
    load();
  };

  const toggle = async (s) => {
    await base44.entities.FloorSystem.update(s.id, { active: !(s.active !== false) });
    load();
  };

  const edit = (s) =>
    setDraft({
      ...s,
      finishesText: (s.finishes || []).join(", "),
      colorsText: (s.colors || []).map((c) => `${c.name}:${c.hex}`).join(", "),
    });

  const shown = systems
    ? filter === "All"
      ? systems
      : systems.filter((s) => s.category === filter)
    : [];

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>Floor <span style={{ color: "var(--vx-accent)" }}>Systems</span></h1>
          <p>Systems, finishes, colors, and base rates that drive the visualizer and pricing.</p>
        </div>
        <button className="hx-mini-btn" onClick={() => setDraft({ finishesText: "", colorsText: "", active: true })}>
          <Plus size={16} /> <span>System</span>
        </button>
      </div>

      {systems && (
        <div className="hx-filters">
          {CATEGORIES.map((c) => (
            <button key={c} className={filter === c ? "active" : ""} onClick={() => setFilter(c)}>
              {c === "All" ? "All" : c.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      {!systems ? (
        <div className="hx-loading"><Loader2 size={24} /></div>
      ) : shown.length === 0 ? (
        <div className="hx-empty">
          <div>
            <span>0</span>
            No systems configured. Add one to get started.
          </div>
        </div>
      ) : (
        <div className="hx-sys-grid">
          {shown.map((s) => (
            <SystemCard key={s.id} system={s} onEdit={() => edit(s)} onToggle={() => toggle(s)} />
          ))}
        </div>
      )}

      {draft && <SystemEditor draft={draft} onClose={() => setDraft(null)} onSave={save} />}
    </div>
  );
}