import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Heart, Wand2, Receipt } from "lucide-react";
import { Card, Chip, Kicker, Notice, Btn, SectionTitle } from "@/components/vx/Primitives";
import Swatch from "@/components/vx/Swatch";
import FinishPhoto from "@/components/vx/FinishPhoto";
import { useVisualX } from "@/components/vx/VisualXContext";
import { receipt } from "@/lib/vx";

export default function ColorStudio({ system, title, kicker, sessionKey }) {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [colors, setColors] = useState([]);
  const [note, setNote] = useState("");
  const activeCode = session[sessionKey];

  useEffect(() => {
    base44.entities.ColorChart.filter({ system }, "rank", 60).then(setColors);
  }, [system]);

  const chosen = colors.find((c) => c.code === activeCode) || colors[0];

  const select = (color) => {
    patch({ [sessionKey]: color.code });
    setNote("");
  };

  const saveFavorite = async () => {
    if (!chosen) return;
    const codes = session.selectedCodes.includes(chosen.code)
      ? session.selectedCodes
      : [...session.selectedCodes, chosen.code];
    patch({ selectedCodes: codes });
    await receipt({
      action: "color_selected",
      detail: `${chosen.color_name} (${chosen.code}) added to the operator selection tray.`,
      category: "audit",
    });
    setNote(`${chosen.color_name} saved to your selections.`);
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3">
        <span
          className="h-16 w-16 shrink-0 rounded-2xl"
          style={{
            background: chosen
              ? `radial-gradient(120% 120% at 25% 20%, ${chosen.hex}f2, ${chosen.hex} 45%, rgba(0,0,0,0.6))`
              : "var(--vx-panel-3)",
          }}
        />
        <div className="min-w-0 flex-1">
          <Kicker>{kicker}</Kicker>
          <h2 className="truncate text-lg font-semibold" style={{ color: "var(--vx-text)" }}>
            {chosen?.color_name || "No color selected"}
          </h2>
          <p className="text-[11px]" style={{ color: "var(--vx-muted)" }}>
            {chosen ? `${chosen.code} · ${chosen.collection || "Collection unlisted"} · ${chosen.sheen || "Sheen unlisted"}` : "Load the verified catalog to choose a finish."}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip tone={chosen?.in_stock ? "ready" : "blocked"}>
              {chosen?.in_stock ? "In stock per chart" : "Availability unverified"}
            </Chip>
          </div>
        </div>
      </Card>

      <SectionTitle
        action={
          <button className="text-[11px] font-semibold" style={{ color: "var(--vx-accent)" }} onClick={() => navigate("/app/products")}>
            View all →
          </button>
        }
      >
        Explore {title}
      </SectionTitle>

      <div className="grid grid-cols-3 gap-2">
        {colors.slice(0, 12).map((color) => (
          <Swatch key={color.id} color={color} active={color.code === chosen?.code} onSelect={select} />
        ))}
      </div>

      <Kicker>Preview your space</Kicker>
      <FinishPhoto
        photoUrl={session.photoUrl}
        maskPoints={session.maskPoints}
        hex={chosen?.hex || "#8f8f8f"}
        controls={session.controls}
        label={chosen?.color_name}
        height="h-48"
      />

      {note ? <Chip tone="ready">{note}</Chip> : null}

      <div className="grid grid-cols-3 gap-2">
        <Btn variant="ghost" onClick={saveFavorite} disabled={!chosen}>
          <Heart className="h-4 w-4" />
        </Btn>
        <Btn variant="outline" onClick={() => navigate("/app/visualizer")} disabled={!chosen}>
          <Wand2 className="h-4 w-4" /> Visual
        </Btn>
        <Btn onClick={() => navigate("/app/quote")} disabled={!chosen}>
          <Receipt className="h-4 w-4" /> Quote
        </Btn>
      </div>

      <Notice>
        Swatches are rendered from the verified chart metadata. Manufacturer imagery, availability, and pricing must be
        confirmed with the supplier before customer presentation.
      </Notice>
    </div>
  );
}