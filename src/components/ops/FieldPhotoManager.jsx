import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Camera, Check, X, Upload } from "lucide-react";

const CATEGORIES = [
  { key: "site_before", label: "Site Before", required: true },
  { key: "prep", label: "Prep & Patch", required: true },
  { key: "primer", label: "Primer", required: true },
  { key: "base_coat", label: "Base Coat", required: true },
  { key: "color_install", label: "Color Install", required: true },
  { key: "topcoat", label: "Topcoat", required: true },
  { key: "site_after", label: "Site After", required: true },
];

export default function FieldPhotoManager({ notify, workOrderId }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    if (workOrderId) { setSelected(workOrderId); }
    else { setOrders(await base44.entities.WorkOrder.list("-created_date", 50)); }
  };
  const loadPhotos = async (id) => { setLoading(true); setPhotos(await base44.entities.FieldPhoto.filter({ work_order_id: id })); setLoading(false); };

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { if (selected) loadPhotos(selected); }, [selected]);

  const upload = async (cat, file) => {
    setUploading(cat);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      let lat = null, lng = null;
      try { const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition((p) => res(p.coords), rej, { timeout: 5000 })); lat = pos.latitude; lng = pos.longitude; } catch {}
      await base44.entities.FieldPhoto.create({ work_order_id: selected, category: cat, file_url, taken_at: new Date().toISOString(), lat, lng });
      await loadPhotos(selected);
      notify("Photo uploaded");
    } catch (e) { notify("Upload failed"); }
    finally { setUploading(null); }
  };

  const remove = async (p) => { await base44.entities.FieldPhoto.delete(p.id); loadPhotos(selected); };

  const done = (cat) => photos.some((p) => p.category === cat);
  const completion = Math.round((CATEGORIES.filter((c) => done(c.key)).length / CATEGORIES.length) * 100);
  const allRequired = CATEGORIES.every((c) => c.required && done(c.key));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {!workOrderId && (
        <div className="hx-scraper-form" style={{ padding: 12 }}>
          <label style={{ fontSize: 12, color: "var(--vx-muted)", fontWeight: 700 }}>Select Work Order</label>
          <select className="hx-scraper-input" value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Choose a work order…</option>
            {orders.map((o) => <option key={o.id} value={o.id}>{o.customer_name || "Untitled"}</option>)}
          </select>
        </div>
      )}

      {selected && (
        <>
          <div className="hx-sys-card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 13 }}>Photo Completion</strong>
              <span style={{ fontSize: 18, fontWeight: 900, color: allRequired ? "var(--vx-accent)" : "var(--vx-warning)" }}>{completion}%</span>
            </div>
            <div style={{ height: 6, background: "var(--vx-panel-3)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", background: allRequired ? "var(--vx-accent)" : "var(--vx-warning)", transition: "width .3s" }} />
            </div>
            {allRequired && <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--vx-accent)", display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> All required photos captured — job ready to complete</p>}
          </div>

          <div className="hx-sys-grid">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="hx-sys-card" style={{ padding: 12 }}>
                <div className="hx-sys-head">
                  <div className="hx-sys-title">
                    <div className="hx-sys-icon" style={done(c.key) ? { borderColor: "var(--vx-accent)", color: "var(--vx-accent)" } : {}}>{done(c.key) ? <Check size={16} /> : <Camera size={16} />}</div>
                    <div><strong>{c.label}</strong>{c.required && <span style={{ color: "var(--vx-warning)" }}> · Required</span>}</div>
                  </div>
                </div>
                {photos.filter((p) => p.category === c.key).map((p) => (
                  <div key={p.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--vx-border-soft)" }}>
                    <img src={p.file_url} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
                    <button onClick={() => remove(p)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 7, border: 0, background: "rgba(0,0,0,.7)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={12} /></button>
                  </div>
                ))}
                <label className="hx-bid-photo-add" style={{ justifyContent: "center", cursor: "pointer" }}>
                  {uploading === c.key ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} Upload
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => e.target.files[0] && upload(c.key, e.target.files[0])} />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}