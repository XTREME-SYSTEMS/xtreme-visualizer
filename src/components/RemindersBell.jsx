import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Calendar, ClipboardList, X } from "lucide-react";

export default function RemindersBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [appts, workOrders] = await Promise.all([
        base44.entities.Appointment.list("-created_date", 50).catch(() => []),
        base44.entities.WorkOrder.list("-created_date", 50).catch(() => []),
      ]);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = (d) => { const x = new Date(d); return x >= today && x < tomorrow; };
      const reminders = [];
      (appts || []).forEach((a) => {
        if (isToday(a.confirmed_start || a.requested_date)) reminders.push({ type: "appointment", label: a.customer_name || "Appointment", detail: a.confirmed_start ? new Date(a.confirmed_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today", status: a.status });
      });
      (workOrders || []).forEach((w) => {
        if (w.status === "assigned" || w.status === "in_progress") reminders.push({ type: "workorder", label: w.customer_name || "Work Order", detail: w.scheduled_date ? new Date(w.scheduled_date).toLocaleDateString() : "Unscheduled", status: w.status });
      });
      setItems(reminders);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = items.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Reminders"
        className="vx-icon-btn"
        style={count > 0 ? { borderColor: "#ff9e2c", color: "#ff9e2c", boxShadow: "0 0 14px rgba(255,158,44,.35)" } : {}}
      >
        <Bell size={18} />
        {count > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9, background: "#ff9e2c", color: "#1a1300", fontSize: 10, fontWeight: 900, display: "grid", placeItems: "center", padding: "0 4px" }}>{count}</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, maxHeight: 360, overflowY: "auto", background: "var(--vx-panel)", border: "1px solid #ff9e2c", borderRadius: 14, boxShadow: "0 16px 44px rgba(0,0,0,.6)", zIndex: 200, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: "#ff9e2c", letterSpacing: ".04em" }}>Reminders</strong>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: 0, color: "#707070", cursor: "pointer" }}><X size={15} /></button>
          </div>
          {loading ? <div style={{ textAlign: "center", padding: 16, color: "#ff9e2c" }}>Loading…</div> :
           items.length === 0 ? <div style={{ textAlign: "center", padding: 16, color: "#707070", fontSize: 12 }}>You're all caught up 🎉</div> :
           items.map((r, i) => (
             <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 8px", borderBottom: "1px solid var(--vx-border-soft)" }}>
               {r.type === "appointment" ? <Calendar size={15} style={{ color: "#ff9e2c", flexShrink: 0 }} /> : <ClipboardList size={15} style={{ color: "#ff9e2c", flexShrink: 0 }} />}
               <div style={{ minWidth: 0 }}>
                 <strong style={{ fontSize: 12, color: "#fff", display: "block" }}>{r.label}</strong>
                 <span style={{ fontSize: 11, color: "#A0A0A0" }}>{r.detail} · {r.status}</span>
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}