import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, LogIn, LogOut } from "lucide-react";

export default function ClockManager({ notify, workOrder }) {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (workOrder) { setOrders([workOrder]); }
    else {
      const list = await base44.entities.WorkOrder.list("-created_date", 50);
      setOrders(list);
    }
    const evs = await base44.entities.ClockEvent.list("-created_date", 100);
    const map = {};
    evs.forEach((e) => { if (!e.clock_out_at) map[e.work_order_id] = e; });
    setEvents(map);
  };
  useEffect(() => { load(); }, []);

  const getPos = () => new Promise((res, rej) => navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), rej, { enableHighAccuracy: true, timeout: 8000 }));

  const clockIn = async (o) => {
    setBusy(true);
    try {
      const pos = await getPos();
      const me = await base44.auth.me();
      const ev = await base44.entities.ClockEvent.create({ work_order_id: o.id, user_name: me?.full_name || "Crew", clock_in_at: new Date().toISOString(), clock_in_lat: pos.lat, clock_in_lng: pos.lng });
      setEvents((m) => ({ ...m, [o.id]: ev }));
      notify("Clocked in at job site");
    } catch (e) { notify("GPS failed: " + (e.message || "denied")); }
    finally { setBusy(false); }
  };

  const clockOut = async (o) => {
    const ev = events[o.id];
    if (!ev) return;
    setBusy(true);
    try {
      const pos = await getPos();
      await base44.entities.ClockEvent.update(ev.id, { clock_out_at: new Date().toISOString(), clock_out_lat: pos.lat, clock_out_lng: pos.lng });
      setEvents((m) => { const n = { ...m }; delete n[o.id]; return n; });
      notify("Clocked out");
    } catch (e) { notify("GPS failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-notice"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />GPS clock-in/out captures your location for time tracking. Allow location access when prompted.</div>
      <div className="hx-list" style={{ maxHeight: 420 }}>
        {orders.length === 0 ? <div className="hx-empty"><span>⏱️</span>No work orders.</div> :
        orders.map((o) => (
          <div key={o.id} className="hx-sys-card" style={{ padding: 12 }}>
            <div className="hx-sys-head">
              <div className="hx-sys-title" style={{ minWidth: 0 }}>
                <div className="hx-sys-icon"><LogIn size={16} /></div>
                <div style={{ minWidth: 0 }}>
                  <strong>{o.customer_name || "Untitled"}</strong>
                  <span>{events[o.id] ? "🟢 On the clock" : "⚪ Not clocked in"}</span>
                </div>
              </div>
              {events[o.id] ? (
                <button className="hx-sys-edit" style={{ color: "var(--vx-danger)", borderColor: "var(--vx-danger)" }} onClick={() => clockOut(o)} disabled={busy}>
                  {busy ? <Loader2 size={14} className="spin" /> : <LogOut size={14} />} Clock Out
                </button>
              ) : (
                <button className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)" }} onClick={() => clockIn(o)} disabled={busy}>
                  {busy ? <Loader2 size={14} className="spin" /> : <LogIn size={14} />} Clock In
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}