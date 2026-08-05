import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, PencilRuler, Share2 } from "lucide-react";
import { Card, Chip, Kicker, Notice, PageHeader, Btn } from "@/components/vx/Primitives";
import { useVisualX } from "@/components/vx/VisualXContext";

const OPTIONS = [
  { key: "flake", slug: "flake-epoxy", title: "Flake Epoxy", subtitle: "Flake Blend", durability: 5, slip: 4, install: "1–2 Days", price: "$$" },
  { key: "metallic", slug: "metallic-epoxy", title: "Metallic Epoxy", subtitle: "Metallic Finish", durability: 4, slip: 3, install: "2–3 Days", price: "$$$" },
  { key: "polished", slug: "polished-concrete", title: "Polished Concrete", subtitle: "Concrete Finish", durability: 5, slip: 3, install: "3–4 Days", price: "$$" },
];

export default function Compare() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [systems, setSystems] = useState([]);

  useEffect(() => {
    base44.entities.FloorSystem.filter({ active: true }, "name", 20).then(setSystems);
  }, []);

  const rateFor = (slug) => {
    const s = systems.find((x) => x.slug === slug);
    if (!s) return "Rate pending";
    return `$${s.base_rate_low}–$${s.base_rate_high}/sf`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Compare Floor Finishes"
        subtitle="Visualize and compare finish options side by side"
        action={
          <Btn variant="outline" className="px-3 py-2 text-xs" onClick={() => navigate("/app/scan")}>
            <PencilRuler className="h-3.5 w-3.5" /> Edit Room
          </Btn>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o, i) => {
          const selected = session.compareSelection === o.key;
          return (
            <button
              key={o.key}
              onClick={() => patch({ compareSelection: o.key, systemSlug: o.slug })}
              className="relative flex flex-col gap-1.5 rounded-2xl border p-2 text-left"
              style={{
                borderColor: selected ? "var(--vx-accent)" : "var(--vx-border-soft)",
                background: selected ? "var(--vx-accent-soft)" : "var(--vx-panel)",
                boxShadow: selected ? "var(--vx-glow)" : "none",
              }}
            >
              {selected ? (
                <span
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-black"
                  style={{ background: "var(--vx-accent)" }}
                >
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <Kicker>Option {String.fromCharCode(65 + i)}</Kicker>
              <span
                className="block h-14 w-full rounded-xl"
                style={{
                  background:
                    o.key === "metallic"
                      ? "radial-gradient(120% 120% at 30% 20%, #7f8c9a, #2b3238 70%)"
                      : o.key === "flake"
                      ? "repeating-linear-gradient(135deg, #4a4f55 0 6px, #2f3337 6px 12px)"
                      : "linear-gradient(160deg, #9aa0a6, #5d6368)",
                }}
              />
              <strong className="text-[11px] leading-tight" style={{ color: "var(--vx-text)" }}>
                {o.title}
              </strong>
              <span className="text-[10px]" style={{ color: "var(--vx-faint)" }}>
                {o.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      <Kicker>Comparison overview</Kicker>
      <Card className="space-y-2 text-[11px]">
        {[
          ["Durability", (o) => "★".repeat(o.durability)],
          ["Slip Resistance", (o) => "●".repeat(o.slip) + "○".repeat(5 - o.slip)],
          ["Install Time", (o) => o.install],
          ["Price Tier", (o) => o.price],
          ["Internal Rate", (o) => rateFor(o.slug)],
        ].map(([label, render]) => (
          <div key={label} className="grid grid-cols-4 items-center gap-1 border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "var(--vx-border-soft)" }}>
            <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--vx-faint)" }}>
              {label}
            </span>
            {OPTIONS.map((o) => (
              <span key={o.key} className="text-center" style={{ color: "var(--vx-muted)" }}>
                {render(o)}
              </span>
            ))}
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Chip tone="blocked">Rates unverified — internal use only</Chip>
        <Chip tone="draft">Customer messaging disabled</Chip>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Btn onClick={() => navigate("/app/visualizer")}>Preview Selection</Btn>
        <Btn variant="outline" onClick={() => navigate("/app/proposal")}>
          <Share2 className="h-4 w-4" /> Prepare Share
        </Btn>
      </div>

      <Notice>
        Comparison ratings are internal guidance. Product suitability, warranty, and pricing require production
        verification before any customer-facing use.
      </Notice>
    </div>
  );
}