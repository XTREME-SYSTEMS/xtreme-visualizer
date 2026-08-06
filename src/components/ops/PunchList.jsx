import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Check, X, PenLine } from "lucide-react";

const DEFAULT_ITEMS = [
  "Floors prepped & patched",
  "Cracks/joints filled",
  "Primer applied evenly",
  "Base coat cured",
  "Color installed per spec",
  "Topcoat applied",
  "Site cleaned & debris removed",
  "Customer walkthrough complete",
];

export default function PunchList({ notify }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const loadOrders = async () => { setOrders(await base44.entities.WorkOrder.list("-created_date", 50)); };
  const loadItems = async (id) => { setLoading(true); setItems(await base44.entities.PunchItem.filter({ work_order_id: id })); setLoading(false); };

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { if (selected) loadItems(selected); }, [selected]);

  const addDefault = async () => {
    for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
      await base44.entities.PunchItem.create({ work_order_id: selected, label: DEFAULT_ITEMS[i], step_order: i });
    }
    loadItems(selected);
    notify("Default punch list added");
  };

  const add = async () => {
    if (!newItem.trim()) return;
    await base44.entities.PunchItem.create({ work_order_id: selected, label: newItem.trim(), step_order: items.length });
    setNewItem("");
    loadItems(selected);
  };

  const toggle = async (it) => { await base44.entities.PunchItem.update(it.id, { done: !it.done, completed_at: !it.done ? new Date().toISOString() : null }); loadItems(selected); };
  const remove = async (it) => { await base44.entities.PunchItem.delete(it.id); loadItems(selected); };

  const allDone = items.length > 0 && items.every((i) => i.done);

  const saveSig = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const { file_url } = await base44.integrations.Core.UploadFile({ file: await (await fetch(dataUrl)).blob() });
    const me = await base44.auth.me();
    await Promise.all(items.map((i) => i.signed_url ? null : base44.entities.PunchItem.update(i.id, { signed_url: file_url, signed_date: new Date().toISOString(), signed_by: me?.full_name || "Crew" })));
    setSigning(false);
    loadItems(selected);
    notify("Punch list signed");
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-form" style={{ padding: 12 }}>
        <label style={{ fontSize: 12, color: "var(--vx-muted)", fontWeight: 700 }}>Select Work Order</label>
        <select className="hx-scraper-input" value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose a work order…</option>
          {orders.map((o) => <option key={o.id} value={o.id}>{o.customer_name || "Untitled"}</option>)}
        </select>
      </div>

      {selected && (
        <>
          <div className="hx-scraper-actionbar">
            <button className="hx-mini-btn dark" onClick={addDefault}><Plus size={14} /> Default Walk-through</button>
          </div>

          {loading ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
          <div className="hx-list" style={{ maxHeight: 300 }}>
            {items.length === 0 ? <div className="hx-empty"><span>✅</span>No punch items yet.</div> :
            items.map((it) => (
              <div key={it.id} className="hx-sys-card" style={{ padding: 10 }}>
                <div className="hx-sys-head">
                  <button onClick={() => toggle(it)} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: 0, cursor: "pointer", textAlign: "left", flex: 1, minWidth: 0 }}>
                    <div className="hx-sys-icon" style={it.done ? { borderColor: "var(--vx-accent)", color: "var(--vx-accent)" } : { width: 24, height: 24 }}>{it.done ? <Check size={14} /> : <span style={{ fontSize: 10, color: "var(--vx-faint)" }}>○</span>}</div>
                    <strong style={{ fontSize: 13, textDecoration: it.done ? "line-through" : "none", color: it.done ? "var(--vx-muted)" : "#fff" }}>{it.label}</strong>
                  </button>
                  <button className="hx-lead-delete" onClick={() => remove(it)}><X size={13} /></button>
                </div>
                {it.signed_url && <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--vx-accent)" }}>✍ Signed {new Date(it.signed_date).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>}

          <div className="hx-scraper-form" style={{ padding: 12 }}>
            <div className="hx-scraper-row">
              <input className="hx-scraper-input" placeholder="Add punch item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
              <button className="hx-bid-logo-btn" onClick={add}><Plus size={13} /></button>
            </div>
          </div>

          {allDone && !signing && (
            <button className="gold-button" style={{ justifyContent: "center" }} onClick={() => setSigning(true)}><PenLine size={15} /> Sign Punch List</button>
          )}
          {signing && (
            <div className="hx-sys-card" style={{ padding: 12 }}>
              <strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Customer Signature</strong>
              <canvas ref={canvasRef} width={320} height={140} style={{ width: "100%", background: "#fff", borderRadius: 10, touchAction: "none", cursor: "crosshair" }}
                onMouseDown={(e) => { const c = canvasRef.current, ctx = c.getContext("2d"); ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); const mv = (ev) => { ctx.lineTo(ev.offsetX, ev.offsetY); ctx.stroke(); }; const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); }}
                onTouchStart={(e) => { e.preventDefault(); const c = canvasRef.current, ctx = c.getContext("2d"); const t = e.touches[0]; const r = c.getBoundingClientRect(); const sx = (t.clientX - r.left) * (320 / r.width), sy = (t.clientY - r.top) * (140 / r.height); ctx.beginPath(); ctx.moveTo(sx, sy); const mv = (ev) => { ev.preventDefault(); const t2 = ev.touches[0]; const x = (t2.clientX - r.left) * (320 / r.width), y = (t2.clientY - r.top) * (140 / r.height); ctx.lineTo(x, y); ctx.stroke(); }; const up = () => { c.removeEventListener("touchmove", mv); c.removeEventListener("touchend", up); }; c.addEventListener("touchmove", mv, { passive: false }); c.addEventListener("touchend", up); }} />
              <div className="hx-bid-controls" style={{ marginTop: 10 }}>
                <button className="hx-sys-edit" onClick={() => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, 320, 140); }}>Clear</button>
                <button className="gold-button" style={{ justifyContent: "center" }} onClick={saveSig}><Check size={15} /> Save Signature</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}