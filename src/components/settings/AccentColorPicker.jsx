import React, { useEffect, useState } from "react";

const STORAGE_KEY = "vx-accent-color";

const PRESETS = [
  { name: "Lime", value: "#9cff00" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#a855f7" },
  { name: "Magenta", value: "#ec4899" },
  { name: "Yellow", value: "#fde047" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
];

function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "156, 255, 0";
  return `${parseInt(m[0], 16)}, ${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}`;
}

export function applyAccent(hex) {
  const root = document.documentElement;
  root.style.setProperty("--vx-accent", hex);
  root.style.setProperty("--vx-accent-soft", `rgba(${hexToRgb(hex)}, 0.12)`);
  root.style.setProperty("--vx-glow", `0 0 24px rgba(${hexToRgb(hex)}, 0.28)`);
  // Sync tailwind primary token (hsl channels) so shadcn buttons match
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  root.style.setProperty("--primary", `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
  root.style.setProperty("--accent", `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
  root.style.setProperty("--ring", `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
}

export function initAccentFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyAccent(saved);
}

export default function AccentColorPicker() {
  const [color, setColor] = useState(() => localStorage.getItem(STORAGE_KEY) || "#9cff00");

  useEffect(() => { initAccentFromStorage(); }, []);

  const choose = (hex) => {
    setColor(hex);
    localStorage.setItem(STORAGE_KEY, hex);
    applyAccent(hex);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">Pick the accent color used across the app — buttons, highlights, and active states update instantly.</p>
      <div className="flex flex-wrap gap-2.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => choose(p.value)}
            title={p.name}
            className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: p.value,
              borderColor: color.toLowerCase() === p.value.toLowerCase() ? "#fff" : "transparent",
              boxShadow: color.toLowerCase() === p.value.toLowerCase() ? `0 0 0 2px ${p.value}` : "none",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <label className="text-[12px] text-slate-500">Custom</label>
        <input
          type="color"
          value={color}
          onChange={(e) => choose(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-slate-300 bg-transparent p-0"
        />
        <span className="text-[12px] font-mono text-slate-400 uppercase">{color}</span>
        <button
          onClick={() => choose("#9cff00")}
          className="ml-auto text-[12px] text-slate-500 hover:text-slate-700 underline"
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}