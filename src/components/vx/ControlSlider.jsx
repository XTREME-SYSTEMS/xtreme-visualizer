import React from "react";

export default function ControlSlider({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--vx-muted)" }}>
        {label}
      </span>
      <input
        type="range"
        min="0"
        max="100"
        value={Number(value) || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vx-range flex-1"
      />
      <output className="w-10 text-right text-xs font-semibold" style={{ color: "var(--vx-accent)" }}>
        {Number(value) || 0}%
      </output>
    </label>
  );
}