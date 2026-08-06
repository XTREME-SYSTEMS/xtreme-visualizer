import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Clock, Camera, CheckSquare, ClipboardList, MapPin, LogIn, LogOut } from "lucide-react";
import FieldPhotoManager from "@/components/ops/FieldPhotoManager";
import PunchList from "@/components/ops/PunchList";
import ClockManager from "@/components/ops/ClockManager";

export default function FieldDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [tab, setTab] = useState("orders");

  const notify = (msg) => {
    const t = document.createElement("div");
    t.className = "vx-toast";
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200;background:var(--vx-panel);color:var(--vx-text);padding:10px 16px;border-radius:10px;border:1px solid var(--vx-accent);font-size:13px;font-weight:700";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const load = async () => {
    if (!user) return;
    const all = await base44.entities.WorkOrder.list("-created_date", 50).catch(() => []);
    // Crew leaders see only their assigned orders; admins see all
    const mine = user.role === "admin" ? all : all.filter((o) => o.crew_leader_id === user.id || o.crew_leader_name === user.full_name);
    setOrders(mine);
  };
  useEffect(() => { load(); }, [user]);

  if (!user) return <div className="hx-loading"><Loader2 size={18} className="spin" /></div>;

  const today = new Date().toDateString();
  const todayOrders = (orders || []).filter((o) => o.scheduled_date && new Date(o.scheduled_date).toDateString() === today);
  const activeOrders = (orders || []).filter((o) => o.status === "in_progress" || o.status === "assigned");

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Field Dashboard</h1>
          <p>Welcome, {user.full_name || user.email} · {todayOrders.length} job(s) today</p>
        </div>
      </div>

      {/* Today's jobs */}
      <div className="hx-section" style={{ flex: "0 0 auto" }}>
        <div className="hx-section-head">
          <h2>Today's Jobs</h2>
        </div>
        <div className="hx-list" style={{ maxHeight: 200 }}>
          {!orders ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
           todayOrders.length === 0 ? <div className="hx-empty"><span>📅</span>No jobs scheduled today.</div> :
           todayOrders.map((o) => (
            <button key={o.id} className="hx-sys-card" style={{ padding: 12, textAlign: "left", cursor: "pointer", border: activeOrder?.id === o.id ? "1px solid var(--vx-accent)" : undefined }} onClick={() => { setActiveOrder(o); setTab("clock"); }}>
              <div className="hx-sys-head">
                <div className="hx-sys-title">
                  <div className="hx-sys-icon"><MapPin size={16} /></div>
                  <div><strong>{o.customer_name}</strong><span>{o.project_address || "No address"}</span></div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: "var(--vx-accent)", border: "1px solid var(--vx-accent)" }}>{o.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active jobs quick access */}
      {activeOrders.length > 0 && !activeOrder && (
        <div className="hx-section" style={{ flex: "0 0 auto" }}>
          <div className="hx-section-head"><h2>Active Jobs</h2></div>
          <div className="hx-list" style={{ maxHeight: 150 }}>
            {activeOrders.map((o) => (
              <button key={o.id} className="hx-sys-card" style={{ padding: 12, textAlign: "left", cursor: "pointer" }} onClick={() => { setActiveOrder(o); setTab("clock"); }}>
                <div className="hx-sys-title">
                  <div className="hx-sys-icon"><ClipboardList size={16} /></div>
                  <div><strong>{o.customer_name}</strong><span>{o.scope_items?.length || 0} scope items</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected work order actions */}
      {activeOrder && (
        <>
          <div className="hx-sys-card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><strong>{activeOrder.customer_name}</strong><br /><span style={{ fontSize: 11, color: "var(--vx-muted)" }}>{activeOrder.project_address}</span></div>
            <button className="hx-mini-btn dark" onClick={() => setActiveOrder(null)}>Close</button>
          </div>

          {/* Tab bar */}
          <div className="hx-filters" style={{ flexShrink: 0 }}>
            <button className={tab === "clock" ? "active" : ""} onClick={() => setTab("clock")}><Clock size={12} style={{ display: "inline", marginRight: 4 }} />Clock</button>
            <button className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}><Camera size={12} style={{ display: "inline", marginRight: 4 }} />Photos</button>
            <button className={tab === "punch" ? "active" : ""} onClick={() => setTab("punch")}><CheckSquare size={12} style={{ display: "inline", marginRight: 4 }} />Punch List</button>
          </div>

          {/* Tab content */}
          {tab === "clock" && <ClockManager workOrder={activeOrder} notify={notify} />}
          {tab === "photos" && <FieldPhotoManager workOrderId={activeOrder.id} notify={notify} />}
          {tab === "punch" && <PunchList workOrder={activeOrder} notify={notify} />}
        </>
      )}

      {/* All orders list when nothing selected */}
      {!activeOrder && (
        <div className="hx-section" style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>
          <div className="hx-section-head"><h2>All My Jobs</h2></div>
          <div className="hx-list">
            {!orders ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
             orders.length === 0 ? <div className="hx-empty"><span>📋</span>No jobs assigned yet.</div> :
             orders.map((o) => (
              <button key={o.id} className="hx-sys-card" style={{ padding: 12, textAlign: "left", cursor: "pointer" }} onClick={() => { setActiveOrder(o); setTab("clock"); }}>
                <div className="hx-sys-head">
                  <div className="hx-sys-title">
                    <div className="hx-sys-icon"><ClipboardList size={16} /></div>
                    <div><strong>{o.customer_name}</strong><span>{o.status} · {o.scope_items?.length || 0} scope</span></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}