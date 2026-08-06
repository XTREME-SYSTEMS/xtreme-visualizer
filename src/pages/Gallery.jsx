import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Camera, ImageOff } from "lucide-react";

export default function Gallery() {
  const [photos, setPhotos] = useState(null);
  const [orders, setOrders] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      // Load all site_before and site_after photos from completed work orders
      const [beforePhotos, afterPhotos, allOrders] = await Promise.all([
        base44.entities.FieldPhoto.filter({ category: "site_before" }, "-created_date", 200).catch(() => []),
        base44.entities.FieldPhoto.filter({ category: "site_after" }, "-created_date", 200).catch(() => []),
        base44.entities.WorkOrder.filter({ status: "completed" }, "-created_date", 100).catch(() => []),
      ]);
      const orderMap = {};
      allOrders.forEach((o) => { orderMap[o.id] = o; });
      setOrders(orderMap);

      // Only include photos from completed work orders, and match before/after pairs
      const completedIds = new Set(allOrders.map((o) => o.id));
      const befores = beforePhotos.filter((p) => completedIds.has(p.work_order_id));
      const afters = afterPhotos.filter((p) => completedIds.has(p.work_order_id));

      // Pair them by work_order_id
      const pairs = {};
      befores.forEach((p) => {
        if (!pairs[p.work_order_id]) pairs[p.work_order_id] = {};
        pairs[p.work_order_id].before = p;
      });
      afters.forEach((p) => {
        if (!pairs[p.work_order_id]) pairs[p.work_order_id] = {};
        pairs[p.work_order_id].after = p;
      });

      const pairList = Object.entries(pairs)
        .filter(([, v]) => v.before && v.after)
        .map(([woId, v]) => ({
          id: woId,
          before: v.before.file_url,
          after: v.after.file_url,
          beforeDate: v.before.taken_at,
          afterDate: v.after.taken_at,
          customer: orders[woId]?.customer_name || "Completed Project",
          address: orders[woId]?.project_address || "",
          system: (orders[woId]?.scope_items || []).map((s) => s.label).join(", ") || "Floor Coating",
        }));
      setPhotos(pairList);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!photos) return [];
    if (filter === "recent") return photos.slice(0, 10);
    return photos;
  }, [photos, filter]);

  return (
    <div className="page hx-page hx-gallery-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Project Gallery</h1>
          <p>{photos?.length || 0} completed projects with before & after photos</p>
        </div>
      </div>

      <div className="hx-filters" style={{ flexShrink: 0 }}>
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({photos?.length || 0})</button>
        <button className={filter === "recent" ? "active" : ""} onClick={() => setFilter("recent")}>Recent 10</button>
      </div>

      <div className="hx-list">
        {!photos ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         filtered.length === 0 ? (
           <div className="hx-empty" style={{ minHeight: 200 }}>
             <span><ImageOff size={28} /></span>
             <p>No completed projects with before & after photos yet.<br />Photos auto-populate here when work orders are completed.</p>
           </div>
         ) : (
           filtered.map((p) => (
             <div key={p.id} className="hx-gallery-card" style={{ aspectRatio: "3 / 2" }}>
               <div className="hx-gallery-img">
                 <img src={p.after} alt={p.customer} />
               </div>
               <div className="hx-gallery-overlay" />
               <div className="hx-gallery-content">
                 <div className="hx-gallery-icon"><Camera size={16} /></div>
                 <div className="hx-gallery-label">
                   <strong>{p.customer}</strong>
                   <span>{p.system}</span>
                 </div>
               </div>
             </div>
           ))
         )}
      </div>
    </div>
  );
}