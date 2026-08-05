import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import { Loader2, Layers, Plus } from "lucide-react";

export default function Systems() {
  const [systems, setSystems] = useState(null);
  const [draft, setDraft] = useState(null);

  const load = () => base44.entities.FloorSystem.list("-created_date", 100).then(setSystems);
  useEffect(() => { load(); }, []);

  if (!systems) {
    return (
      <div className="py-24 grid place-items-center" style={{ color: "var(--vx-muted)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--vx-accent)" }} />
      </div>
    );
  }

  const save = async () => {
    const payload = {
      name: draft.name,
      category: draft.category || "epoxy",
      description: draft.description || "",
      finishes: (draft.finishesText || "").split(",").map((s) => s.trim()).filter(Boolean),
      colors: (draft.colorsText || "").split(",").map((s) => s.trim()).filter(Boolean).map((pair) => {
        const [n, hex] = pair.split(":").map((x) => x.trim());
        return { name: n, hex: hex || "#888888" };
      }),
      base_rate_low: Number(draft.base_rate_low) || 0,
      base_rate_high: Number(draft.base_rate_high) || 0,
      active: draft.active !== false,
    };
    if (draft.id) await base44.entities.FloorSystem.update(draft.id, payload);
    else await base44.entities.FloorSystem.create(payload);
    setDraft(null);
    load();
  };

  const fieldStyle = { display: "grid", gap: 6, fontSize: 12, color: "var(--vx-muted)", fontWeight: 700 };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Configuration"
        title="Floor systems and colors"
        description="Systems, finishes, colors, and per-square-foot base rates that drive the visualizer and the preliminary range."
        actions={
          <button className="vx-btn primary" onClick={() => setDraft({ finishesText: "", colorsText: "", active: true })}>
            <Plus size={16} /> New system
          </button>
        }
      />

      {draft && (
        <div className="content-card form-grid">
          <div className="form-grid two">
            <label className="field">Name
              <input className="vx-input" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className="field">Category
              <input className="vx-input" value={draft.category || ""} placeholder="epoxy / polished_concrete / coating" onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </label>
            <label className="field">Finishes (comma separated)
              <input className="vx-input" value={draft.finishesText || ""} onChange={(e) => setDraft({ ...draft, finishesText: e.target.value })} />
            </label>
            <label className="field">Colors (Name:#hex, comma separated)
              <input className="vx-input" value={draft.colorsText || ""} onChange={(e) => setDraft({ ...draft, colorsText: e.target.value })} />
            </label>
            <label className="field">Base rate low ($/sqft)
              <input className="vx-input" type="number" value={draft.base_rate_low || ""} onChange={(e) => setDraft({ ...draft, base_rate_low: e.target.value })} />
            </label>
            <label className="field">Base rate high ($/sqft)
              <input className="vx-input" type="number" value={draft.base_rate_high || ""} onChange={(e) => setDraft({ ...draft, base_rate_high: e.target.value })} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>Description
              <input className="vx-input" value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
          </div>
          <div className="viz-toggle-row">
            <button className="vx-btn primary" disabled={!draft.name} onClick={save}>Save system</button>
            <button className="vx-btn" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!systems.length ? (
        <EmptyState icon={Layers} title="No floor systems configured" hint="Add a system so the visualizer and pricing engine have something to work with." />
      ) : (
        <div className="section" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {systems.map((s) => (
            <div key={s.id} className="content-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--vx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                  <span className="vx-kicker">{s.category?.replace(/_/g, " ")}</span>
                </div>
                <button
                  className="vx-btn compact"
                  style={s.active !== false ? { background: "var(--vx-accent)", color: "#061000", borderColor: "var(--vx-accent)" } : {}}
                  onClick={async () => { await base44.entities.FloorSystem.update(s.id, { active: !(s.active !== false) }); load(); }}
                >
                  {s.active !== false ? "Active" : "Inactive"}
                </button>
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}>{s.description}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(s.colors || []).map((c) => (
                  <span key={c.name} title={c.name} style={{ width: 20, height: 20, borderRadius: 5, border: "1px solid var(--vx-border-soft)", background: c.hex }} />
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "var(--vx-accent)" }}>${s.base_rate_low} – ${s.base_rate_high} / sq ft</p>
              <p style={{ marginTop: 4, fontSize: 11, color: "var(--vx-faint)" }}>{(s.finishes || []).join(" · ")}</p>
              {s.sheen_levels && s.sheen_levels.length > 0 && (
                <p style={{ marginTop: 6, fontSize: 10, color: "var(--vx-faint)" }}>Sheen: {s.sheen_levels.join(" · ")}</p>
              )}
              {s.product_skus && s.product_skus.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.product_skus.slice(0, 4).map((sku) => (
                    <span key={sku} style={{ padding: "2px 6px", borderRadius: 5, fontSize: 9, background: "var(--vx-panel-3)", color: "var(--vx-muted)", fontFamily: "monospace" }}>{sku}</span>
                  ))}
                  {s.product_skus.length > 4 && <span style={{ fontSize: 9, color: "var(--vx-faint)" }}>+{s.product_skus.length - 4}</span>}
                </div>
              )}
              <button
                className="vx-btn outline-accent"
                style={{ marginTop: 14, width: "100%" }}
                onClick={() => setDraft({
                  ...s,
                  finishesText: (s.finishes || []).join(", "),
                  colorsText: (s.colors || []).map((c) => `${c.name}:${c.hex}`).join(", "),
                })}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}