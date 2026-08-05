import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Layers, Sparkles, Save, ArrowRight, Loader2 } from "lucide-react";
import { Card, Chip, Kicker, Notice, Btn } from "@/components/vx/Primitives";
import FinishPhoto from "@/components/vx/FinishPhoto";
import ControlSlider from "@/components/vx/ControlSlider";
import { useVisualX } from "@/components/vx/VisualXContext";
import { receipt } from "@/lib/vx";

const MODES = [
  ["before", "Before"],
  ["after", "After"],
  ["split", "Split View"],
];

export default function Visualizer() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [systems, setSystems] = useState([]);
  const [color, setColor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setSystems(await base44.entities.FloorSystem.filter({ active: true }, "name", 20));
      const code = session.blendCode || session.metallicCode;
      if (code) {
        const [match] = await base44.entities.ColorChart.filter({ code }, "-rank", 1);
        setColor(match || null);
      }
    })();
  }, [session.blendCode, session.metallicCode]);

  const system = systems.find((s) => s.slug === session.systemSlug);
  const hex = color?.hex || "#8f8f8f";

  const save = async () => {
    setSaving(true);
    const record = await base44.entities.Visualization.create({
      lead_id: session.leadId || undefined,
      label: `${system?.name || "System pending"} · ${color?.color_name || "Color pending"}`,
      source_photo_url: session.photoUrl,
      mask_points: session.maskPoints,
      system_name: system?.name,
      system_slug: session.systemSlug,
      color_name: color?.color_name,
      color_hex: color?.hex,
      gloss: session.controls.gloss,
      texture: session.controls.texture,
      coverage: session.controls.coverage,
      square_feet: session.squareFeet,
    });
    await receipt({
      action: "visualization_saved",
      detail: `Manual visualization ${record.id} saved with operator-approved mask.`,
      category: "visualization",
      lead_id: session.leadId || undefined,
    });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <FinishPhoto
        photoUrl={session.photoUrl}
        maskPoints={session.maskPoints}
        hex={hex}
        controls={session.controls}
        mode={session.visualMode}
        label={system?.name || "System pending"}
        height="h-60"
      />

      <div className="grid grid-cols-3 gap-2">
        {MODES.map(([key, label]) => {
          const active = session.visualMode === key;
          return (
            <button
              key={key}
              onClick={() => patch({ visualMode: key })}
              className="rounded-xl border py-2 text-[11px] font-semibold"
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

      <Kicker>System</Kicker>
      <div className="grid grid-cols-3 gap-2">
        {systems.map((s) => {
          const active = session.systemSlug === s.slug;
          const Icon = s.slug?.includes("metallic") ? Sparkles : Layers;
          return (
            <button
              key={s.id}
              onClick={() => patch({ systemSlug: s.slug })}
              className="flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[10px] font-semibold leading-tight"
              style={{
                borderColor: active ? "var(--vx-accent)" : "var(--vx-border-soft)",
                color: active ? "var(--vx-accent)" : "var(--vx-muted)",
                background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)",
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="text-center">{s.name}</span>
            </button>
          );
        })}
      </div>

      <Card className="space-y-3">
        <Kicker>Adjust look &amp; performance</Kicker>
        {[
          ["gloss", "Gloss"],
          ["texture", "Texture"],
          ["coverage", "Coverage"],
          ["opacity", "Overlay"],
        ].map(([key, label]) => (
          <ControlSlider
            key={key}
            label={label}
            value={session.controls[key]}
            onChange={(value) => patch({ controls: { ...session.controls, [key]: value } })}
          />
        ))}
        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "var(--vx-border-soft)" }}>
          <Chip tone={color ? "ready" : "blocked"}>{color ? color.color_name : "No color selected"}</Chip>
          <Chip tone={session.squareFeet ? "ready" : "blocked"}>
            {session.squareFeet ? `${Number(session.squareFeet).toLocaleString()} sq ft` : "Area not recorded"}
          </Chip>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" onClick={save} disabled={!session.photoUrl || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Visual"}
        </Btn>
        <Btn onClick={() => navigate("/app/quote")}>
          Build Quote <ArrowRight className="h-4 w-4" />
        </Btn>
      </div>

      <Notice>
        <strong>Approximate visualization.</strong> Color, gloss, lighting, texture, and final installation may vary.
      </Notice>
    </div>
  );
}