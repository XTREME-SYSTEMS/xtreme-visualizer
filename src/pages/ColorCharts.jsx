import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import { Loader2, Palette } from "lucide-react";
import ColorSwatch from "@/components/vq/ColorSwatch";

const SYSTEMS = [
  { key: "all", label: "All" },
  { key: "metallic", label: "Metallic" },
  { key: "flake", label: "Flake" },
  { key: "quartz", label: "Quartz" },
  { key: "solid", label: "Solid" },
  { key: "glitter", label: "Glitter" },
  { key: "dye_stain", label: "Dye & Stain" },
  { key: "joint_filler", label: "Joint Filler" },
];

export default function ColorCharts() {
  const [items, setItems] = useState(null);
  const [sys, setSys] = useState("all");

  useEffect(() => { base44.entities.ColorChart.list("-created_date", 300).then(setItems); }, []);

  if (!items) {
    return (
      <div className="py-24 grid place-items-center" style={{ color: "var(--vx-muted)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--vx-accent)" }} />
      </div>
    );
  }

  const shown = sys === "all" ? items : items.filter((c) => c.system === sys);
  const grouped = shown.reduce((acc, c) => {
    const k = c.collection || "Other";
    (acc[k] = acc[k] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="page">
      <PageHeader
        eyebrow="Color base · Xtreme Polishing Systems"
        title="Color charts"
        description="Live manufacturer product photos pulled from xtremepolishingsystems.com and ameripolish.com — exact metallic, flake, quartz, solid, glitter, and dye colors with their official codes. These feed the visualizer and image generator."
      />

      <div className="vx-tabbar" style={{ overflowX: "auto" }}>
        {SYSTEMS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSys(s.key)}
            className={sys === s.key ? "active" : ""}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!shown.length ? (
        <EmptyState icon={Palette} title="No colors in this system" />
      ) : (
        <div className="section">
          {Object.entries(grouped).map(([collection, colors]) => (
            <div key={collection} className="section">
              <span className="vx-kicker">{collection} · {colors.length}</span>
              <div className="swatches" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
                {colors.map((c) => (
                  <div key={c.id} className="content-card" style={{ padding: 0, overflow: "hidden" }}>
                    <ColorSwatch color={c} system={c.system} className="h-24" />
                    <div style={{ padding: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.color_name}</p>
                      <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--vx-faint)" }}>{c.code}</p>
                      <p style={{ fontFamily: "monospace", fontSize: 10, color: "var(--vx-faint)", marginTop: 2 }}>{c.hex}</p>
                      {c.sheen && (
                        <span style={{ display: "inline-block", marginTop: 6, padding: "2px 6px", borderRadius: 6, fontSize: 9, background: "var(--vx-panel-3)", color: "var(--vx-muted)" }}>{c.sheen}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}