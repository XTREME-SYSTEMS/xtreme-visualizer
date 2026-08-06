import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Gallery() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    base44.entities.Visualization.list("-created_date", 100)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>Gallery</h1>
          <p>AI-generated floor visualizations and concept previews.</p>
        </div>
      </div>
      {items === null ? (
        <div className="hx-loading"><Loader2 size={24} /></div>
      ) : items.length === 0 ? (
        <div className="hx-empty">
          <div>
            <span>0</span>
            No visualizations yet. Create one from the visualizer.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {items.map((v) => (
            <div key={v.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--vx-border-soft)", background: "#1A1A1A" }}>
              <img src={v.image_url} alt={v.label || ""} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "8px 10px" }}>
                <strong style={{ display: "block", fontSize: 12, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.label || v.system_name || "Untitled"}</strong>
                {v.color_name && <small style={{ color: "#A0A0A0", fontSize: 10 }}>{v.color_name}</small>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}