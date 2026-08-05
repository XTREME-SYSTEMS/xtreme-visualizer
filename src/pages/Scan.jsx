import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, RotateCcw, Ruler, Plus, Trash2 } from "lucide-react";
import { Card, Chip, Kicker, Notice, PageHeader, Btn } from "@/components/vx/Primitives";
import MaskEditor from "@/components/vx/MaskEditor";
import { useVisualX } from "@/components/vx/VisualXContext";
import { DEFAULT_MASK, SPACE_PRESETS, coveragePct, receipt } from "@/lib/vx";

export default function Scan() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [areas, setAreas] = useState([{ label: "Main floor", length: "", width: "" }]);

  const measured = areas.reduce(
    (sum, a) => sum + (Number(a.length) || 0) * (Number(a.width) || 0),
    0
  );

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    patch({ photoUrl: file_url });
    await receipt({
      action: "photo_captured",
      detail: "Operator uploaded an original site photo.",
      category: "photo",
    });
    setUploading(false);
  };

  const setArea = (index, key, value) =>
    setAreas((prev) => prev.map((a, i) => (i === index ? { ...a, [key]: value } : a)));

  const commitArea = async () => {
    patch({ squareFeet: measured });
    await receipt({
      action: "square_feet_recorded",
      detail: `Operator recorded ${measured.toLocaleString()} sq ft from manual measurements.`,
      category: "mask",
    });
    navigate("/app/visualizer");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Room Scan" subtitle="Manual mask · operator controlled" />

      <MaskEditor
        photoUrl={session.photoUrl}
        points={session.maskPoints}
        onChange={(maskPoints) => patch({ maskPoints })}
      />

      <div className="grid grid-cols-4 gap-2">
        <button
          disabled
          title="Automatic masking requires an approved model"
          className="rounded-2xl border px-1 py-3 text-[10px] font-semibold uppercase leading-tight opacity-40"
          style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-muted)" }}
        >
          Auto
          <br />
          Detect
        </button>
        <button
          onClick={() => patch({ maskPoints: DEFAULT_MASK })}
          className="rounded-2xl border px-1 py-3 text-[10px] font-semibold uppercase leading-tight"
          style={{ borderColor: "var(--vx-accent)", color: "var(--vx-accent)", background: "var(--vx-accent-soft)" }}
        >
          Reset
          <br />
          Mask
        </button>
        <button
          onClick={() =>
            patch({ maskPoints: [...session.maskPoints, [0.5, 0.5]] })
          }
          className="rounded-2xl border px-1 py-3 text-[10px] font-semibold uppercase leading-tight"
          style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-muted)" }}
        >
          Add
          <br />
          Point
        </button>
        <button
          onClick={() =>
            session.maskPoints.length > 3 &&
            patch({ maskPoints: session.maskPoints.slice(0, -1) })
          }
          className="rounded-2xl border px-1 py-3 text-[10px] font-semibold uppercase leading-tight"
          style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-muted)" }}
        >
          Remove
          <br />
          Point
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SPACE_PRESETS.map((preset) => {
          const active = session.spacePreset === preset;
          return (
            <button
              key={preset}
              onClick={() => patch({ spacePreset: preset })}
              className="rounded-xl border py-2 text-[11px] font-semibold capitalize"
              style={{
                borderColor: active ? "var(--vx-accent)" : "var(--vx-border-soft)",
                color: active ? "var(--vx-accent)" : "var(--vx-muted)",
                background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)",
              }}
            >
              {preset}
            </button>
          );
        })}
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 text-center text-[9px] font-bold uppercase leading-tight"
            style={{ borderColor: "var(--vx-accent)", color: "var(--vx-accent)" }}
          >
            Manual
            <br />
            mask
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold" style={{ color: "var(--vx-text)" }}>
              Floor Area Verification
            </h3>
            <p className="text-[11px]" style={{ color: "var(--vx-muted)" }}>
              Automatic detection is disabled. The operator controls every point.
            </p>
            <Chip tone="progress">{coveragePct(session.maskPoints)}% frame coverage</Chip>
          </div>
        </div>

        <Kicker>Manual measurements (ft)</Kicker>
        {areas.map((area, i) => (
          <div key={i} className="grid grid-cols-[1fr,auto,auto,auto] items-center gap-2">
            <input
              className="vx-input"
              value={area.label}
              placeholder="Area"
              onChange={(e) => setArea(i, "label", e.target.value)}
            />
            <input
              className="vx-input w-16"
              type="number"
              value={area.length}
              placeholder="L"
              onChange={(e) => setArea(i, "length", e.target.value)}
            />
            <input
              className="vx-input w-16"
              type="number"
              value={area.width}
              placeholder="W"
              onChange={(e) => setArea(i, "width", e.target.value)}
            />
            <button
              onClick={() => setAreas((prev) => prev.filter((_, x) => x !== i))}
              aria-label="Remove area"
              className="grid h-9 w-9 place-items-center rounded-xl border"
              style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-danger)" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setAreas((prev) => [...prev, { label: "Area", length: "", width: "" }])}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: "var(--vx-accent)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Add area
        </button>

        <div className="flex items-end justify-between border-t pt-3" style={{ borderColor: "var(--vx-border-soft)" }}>
          <Kicker>Estimated floor area</Kicker>
          <strong className="text-xl" style={{ color: "var(--vx-accent)" }}>
            {measured.toLocaleString()} SQ FT
          </strong>
        </div>
      </Card>

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} />

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {session.photoUrl ? "Replace Photo" : "Capture Photo"}
        </Btn>
        <Btn onClick={commitArea} disabled={!measured}>
          <Ruler className="h-4 w-4" /> Use Area
        </Btn>
      </div>

      <Btn variant="ghost" onClick={() => patch({ maskPoints: DEFAULT_MASK, photoUrl: "" })} className="w-full">
        <RotateCcw className="h-4 w-4" /> Clear photo and mask
      </Btn>

      <Notice>
        <strong>Automatic masking is disabled.</strong> Every mask point and measurement is operator entered and audited.
      </Notice>
    </div>
  );
}