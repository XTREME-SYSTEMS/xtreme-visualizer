import React from "react";
import { ImageOff } from "lucide-react";

export default function FinishPhoto({
  photoUrl,
  maskPoints = [],
  hex = "#9cff00",
  controls = { gloss: 68, texture: 42, coverage: 74, opacity: 62 },
  mode = "after",
  label,
  height = "h-56",
}) {
  const polygon = maskPoints.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(", ");
  const showFinish = mode !== "before";
  const opacity = (Number(controls.opacity) || 62) / 100;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--vx-radius)] border ${height}`}
      style={{ borderColor: "var(--vx-border-soft)", background: "var(--vx-panel-2)" }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="Room floor" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs"
          style={{ color: "var(--vx-faint)" }}
        >
          <ImageOff className="h-6 w-6" />
          No operator photo captured yet
        </div>
      )}

      {photoUrl && showFinish && maskPoints.length > 2 ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: `polygon(${polygon})`,
            width: mode === "split" ? "50%" : "100%",
            background: `linear-gradient(160deg, ${hex} 0%, ${hex}cc 55%, ${hex}80 100%)`,
            opacity,
            mixBlendMode: "hard-light",
            filter: `saturate(${100 + (Number(controls.gloss) || 0) / 2}%) contrast(${100 + (Number(controls.texture) || 0) / 4}%)`,
          }}
        />
      ) : null}

      {photoUrl && showFinish && maskPoints.length > 2 ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: `polygon(${polygon})`,
            width: mode === "split" ? "50%" : "100%",
            background: `linear-gradient(100deg, rgba(255,255,255,${(Number(controls.gloss) || 0) / 320}) 0%, transparent 45%, rgba(255,255,255,${(Number(controls.gloss) || 0) / 500}) 100%)`,
          }}
        />
      ) : null}

      {mode === "split" && photoUrl ? (
        <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--vx-accent)" }} />
      ) : null}

      {label ? (
        <span
          className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: "rgba(0,0,0,0.55)", color: "#f7f7f7" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}