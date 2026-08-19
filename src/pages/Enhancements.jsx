import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";

const CATEGORIES = [
  { id: "revenue", label: "Revenue", color: "#f0f40b" },
  { id: "operations", label: "Operations", color: "#43a9ff" },
  { id: "intelligence", label: "Intelligence", color: "#ffd000" },
  { id: "customer", label: "Customer", color: "#ff5258" },
  { id: "technical", label: "Technical", color: "#b7b7b7" },
];

const STATUS_ICONS = {
  logged: { icon: Clock, color: "#707070" },
  planned: { icon: Clock, color: "#43a9ff" },
  in_progress: { icon: Loader2, color: "#ffd000" },
  implemented: { icon: CheckCircle2, color: "#f0f40b" },
  audited: { icon: CheckCircle2, color: "#43a9ff" },
  validated: { icon: CheckCircle2, color: "#f0f40b" },
  deferred: { icon: AlertTriangle, color: "#707070" },
};

export default function Enhancements() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => base44.entities.Enhancement.list("priority", 100).then(setItems);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.Enhancement.update(id, { status });
    load();
  };

  const filtered = items?.filter((i) => filter === "all" || i.category === filter) || [];
  const stats = CATEGORIES.map((c) => ({
    ...c,
    total: items?.filter((i) => i.category === c.id).length || 0,
    done: items?.filter((i) => i.category === c.id && ["implemented", "audited", "validated"].includes(i.status)).length || 0,
  }));

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Enhancement Tracker</h1>
          <p>{items?.length || 0} enhancements · {items?.filter((i) => ["implemented", "audited", "validated"].includes(i.status)).length || 0} done</p>
        </div>
        <button className="hx-icon-btn" onClick={load}><RefreshCw size={16} /></button>
      </div>

      {/* Category stats */}
      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        {stats.map((s) => (
          <div key={s.id} className="hx-stat" style={{ cursor: "pointer", borderRight: filter === s.id ? "2px solid var(--vx-accent)" : undefined }} onClick={() => setFilter(filter === s.id ? "all" : s.id)}>
            <div style={{ fontSize: 11, fontWeight: 800, color: s.color, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
            <strong>{s.done}/{s.total}</strong>
            <small style={{ fontSize: 9, color: "var(--vx-faint)" }}>{s.total > 0 ? Math.round(s.done / s.total * 100) : 0}%</small>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="hx-filters" style={{ flexShrink: 0 }}>
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({items?.length || 0})</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={filter === c.id ? "active" : ""} onClick={() => setFilter(c.id)}>{c.label}</button>
        ))}
      </div>

      {/* Enhancement list */}
      <div className="hx-list">
        {!items ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
          filtered.map((item) => {
            const SI = STATUS_ICONS[item.status] || STATUS_ICONS.logged;
            const Icon = SI.icon;
            return (
              <div key={item.id} className="hx-sys-card" style={{ padding: 12, display: "grid", gap: 8 }}>
                <div className="hx-sys-head">
                  <div className="hx-sys-title" style={{ minWidth: 0 }}>
                    <div className="hx-sys-icon" style={{ borderColor: CATEGORIES.find((c) => c.id === item.category)?.color, color: CATEGORIES.find((c) => c.id === item.category)?.color }}>
                      <span style={{ fontSize: 11, fontWeight: 900 }}>#{item.priority}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong>{item.title}</strong>
                      <span style={{ textTransform: "capitalize" }}>{item.category} · {item.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <Icon size={16} className={item.status === "in_progress" ? "spin" : ""} style={{ color: SI.color, flexShrink: 0 }} />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.4 }}>{item.description}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--vx-accent)", lineHeight: 1.3 }}>📊 {item.impact}</p>
                {item.implementation_notes && <p style={{ margin: 0, fontSize: 11, color: "var(--vx-faint)", lineHeight: 1.3, borderTop: "1px solid var(--vx-border-soft)", paddingTop: 4 }}>🔧 {item.implementation_notes}</p>}
                {item.audit_notes && <p style={{ margin: 0, fontSize: 11, color: "#43a9ff", lineHeight: 1.3 }}>🔍 {item.audit_notes}</p>}
                <select className="hx-scraper-input" style={{ fontSize: 11, padding: "5px 10px" }} value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>
                  <option value="logged">Logged</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="implemented">Implemented</option>
                  <option value="audited">Audited</option>
                  <option value="validated">Validated</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}