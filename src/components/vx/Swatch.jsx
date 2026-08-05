import React from "react";

export default function Swatch({ color, active, onSelect }) {
  const hex = color.hex || "#9cff00";
  return (
    <button
      onClick={() => onSelect(color)}
      className="group flex flex-col gap-1.5 rounded-2xl border p-1.5 text-left transition active:scale-[0.97]"
      style={{
        borderColor: active ? "var(--vx-accent)" : "var(--vx-border-soft)",
        background: active ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
        boxShadow: active ? "var(--vx-glow)" : "none",
      }}
    >
      <span
        className="block h-16 w-full rounded-xl"
        style={{
          background: `radial-gradient(120% 120% at 25% 20%, ${hex}f2 0%, ${hex} 45%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
      <span className="block px-1 pb-0.5">
        <span className="block truncate text-[11px] font-semibold" style={{ color: "var(--vx-text)" }}>
          {color.color_name}
        </span>
        <span className="block truncate text-[10px]" style={{ color: "var(--vx-faint)" }}>
          {color.code}
        </span>
      </span>
    </button>
  );
}