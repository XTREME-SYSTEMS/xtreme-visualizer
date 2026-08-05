import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Layers } from "lucide-react";
import { Card, Chip, EmptyState, Kicker, Notice, Btn } from "@/components/vx/Primitives";
import Swatch from "@/components/vx/Swatch";
import { useVisualX } from "@/components/vx/VisualXContext";
import { money, receipt } from "@/lib/vx";

const TABS = [
  ["all", "All"],
  ["metallic", "Metallics"],
  ["flake", "Flake"],
  ["quartz", "Quartz"],
  ["solid", "Solid"],
  ["glitter", "Glitter"],
  ["dye_stain", "Dye / Stain"],
  ["joint_filler", "Joint Filler"],
];

export default function Products() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [colors, setColors] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        base44.entities.ColorChart.list("rank", 300),
        base44.entities.Product.filter({ active: true }, "name", 50),
      ]);
      setColors(c);
      setProducts(p);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors.filter(
      (c) =>
        (tab === "all" || c.system === tab) &&
        (!q ||
          `${c.color_name} ${c.code} ${c.collection || ""}`.toLowerCase().includes(q))
    );
  }, [colors, tab, query]);

  const toggle = async (color) => {
    const has = session.selectedCodes.includes(color.code);
    const codes = has
      ? session.selectedCodes.filter((c) => c !== color.code)
      : [...session.selectedCodes, color.code];
    patch({ selectedCodes: codes });
    if (!has) {
      await receipt({
        action: "color_selected",
        detail: `${color.color_name} (${color.code}) added from the catalog browser.`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 vx-scroll">
        {TABS.map(([key, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
              style={{
                borderColor: active ? "var(--vx-accent)" : "var(--vx-border-soft)",
                color: active ? "var(--vx-accent)" : "var(--vx-muted)",
                background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--vx-faint)" }} />
        <input
          className="vx-input pl-10"
          value={query}
          placeholder="Search the verified color chart"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Kicker>{filtered.length} verified swatches</Kicker>
        <Chip tone="blocked">Prices require verification</Chip>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.slice(0, 90).map((color) => (
            <Swatch
              key={color.id}
              color={color}
              active={session.selectedCodes.includes(color.code)}
              onSelect={toggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No catalog match" text="Change the search or category. No product is fabricated." />
      )}

      <Kicker>Product catalog</Kicker>
      {products.length ? (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Kicker>{p.category}</Kicker>
                <h3 className="truncate text-sm font-semibold" style={{ color: "var(--vx-text)" }}>
                  {p.name}
                </h3>
                <p className="text-[11px]" style={{ color: "var(--vx-muted)" }}>
                  {p.subtitle || p.specs || "Specifications pending"}
                </p>
              </div>
              <Chip tone={p.price_verified && p.customer_facing_enabled ? "ready" : "blocked"}>
                {p.price_verified && p.customer_facing_enabled
                  ? money.format(p.price || 0)
                  : "Price verification required"}
              </Chip>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No verified products loaded"
          text="Live product pricing, availability, and warranty language could not be verified in this environment, so no product records are fabricated."
        />
      )}

      <Card className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {session.selectedCodes.slice(0, 3).map((code) => {
            const c = colors.find((x) => x.code === code);
            return (
              <span
                key={code}
                className="h-9 w-9 rounded-full border-2"
                style={{ background: c?.hex || "var(--vx-panel-3)", borderColor: "var(--vx-panel)" }}
              />
            );
          })}
          {!session.selectedCodes.length ? <Layers className="h-5 w-5" style={{ color: "var(--vx-faint)" }} /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm" style={{ color: "var(--vx-text)" }}>
            {session.selectedCodes.length} selected
          </strong>
          <span className="text-[11px]" style={{ color: "var(--vx-faint)" }}>
            Availability not verified
          </span>
        </div>
        <Btn className="px-3 py-2 text-xs" disabled={!session.selectedCodes.length} onClick={() => navigate("/app/visualizer")}>
          Attach to Visual
        </Btn>
      </Card>

      <Notice>
        The chart contains 228 verified records across metallic, flake, quartz, solid, glitter, dye/stain, and joint
        filler systems. Remote manufacturer imagery and scraped pricing were not refreshed in this environment.
      </Notice>
    </div>
  );
}