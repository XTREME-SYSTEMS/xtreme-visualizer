import React, { useEffect, useRef, useState } from "react";
import { Save, Check, RotateCcw } from "lucide-react";

const STORAGE_KEY = "vx-accent-color";
const DEFAULT_COLOR = "#f0f40b";

const PRESETS = [
  { name: "Gold", value: "#f0f40b" },
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
  if (!m) return "255, 215, 0";
  return `${parseInt(m[0], 16)}, ${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}`;
}

function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lighten(hex, amt) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const r = parseInt(m[0], 16), g = parseInt(m[1], 16), b = parseInt(m[2], 16);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

function luminance(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return 1;
  const [r, g, b] = [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToHsl(hex) {
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
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyAccent(hex) {
  const root = document.documentElement;
  const rgb = hexToRgb(hex);
  const accent2 = lighten(hex, 0.28);
  const hsl = hexToHsl(hex);
  const hsl2 = hexToHsl(accent2);
  const fg = luminance(hex) > 0.5 ? "0 0% 4%" : "0 0% 98%";

  root.style.setProperty("--vx-accent", hex);
  root.style.setProperty("--vx-accent-2", accent2);
  root.style.setProperty("--vx-accent-soft", `rgba(${rgb}, 0.12)`);
  root.style.setProperty("--vx-glow", `0 0 24px rgba(${rgb}, 0.28)`);
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--accent", hsl);
  root.style.setProperty("--accent-foreground", fg);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-primary-foreground", fg);
  root.style.setProperty("--sidebar-accent", hsl);
  root.style.setProperty("--sidebar-accent-foreground", fg);
  root.style.setProperty("--sidebar-ring", hsl);
  root.style.setProperty("--secondary", hsl2);
}

export function initAccentFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyAccent(saved);
}

function readSaved() {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_COLOR; } catch { return DEFAULT_COLOR; }
}

export default function AccentColorPicker() {
  const [draft, setDraft] = useState(readSaved);
  const [saved, setSaved] = useState(readSaved);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedRef = useRef(saved);
  useEffect(() => { savedRef.current = saved; }, [saved]);

  // Restore the persisted accent when the picker first mounts
  useEffect(() => { initAccentFromStorage(); }, []);

  // Live-preview the draft color across the app
  useEffect(() => { applyAccent(draft); }, [draft]);

  // Revert to the saved color when leaving the picker without saving
  useEffect(() => {
    return () => { applyAccent(savedRef.current); };
  }, []);

  const isDirty = draft.toLowerCase() !== saved.toLowerCase();

  const choose = (hex) => setDraft(hex);

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, draft); } catch {}
    setSaved(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const reset = () => setDraft(DEFAULT_COLOR);

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--vx-muted)]">Pick the accent color used across the app — buttons, highlights, and active states. Press <strong>Save</strong> to keep your choice.</p>
      <div className="flex flex-wrap gap-2.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => choose(p.value)}
            title={p.name}
            className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: p.value,
              borderColor: draft.toLowerCase() === p.value.toLowerCase() ? "#fff" : "transparent",
              boxShadow: draft.toLowerCase() === p.value.toLowerCase() ? `0 0 0 2px ${p.value}` : "none",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <label className="text-[12px] text-[var(--vx-muted)]">Custom</label>
        <input
          type="color"
          value={draft}
          onChange={(e) => choose(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-[var(--vx-border-soft)] bg-transparent p-0"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
          }}
          onBlur={(e) => {
            let v = e.target.value.trim();
            if (v && !v.startsWith("#")) v = "#" + v;
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
              choose(v);
            } else {
              setDraft(saved);
            }
          }}
          placeholder="#f0f40b"
          className="w-24 px-2 py-1.5 text-[12px] font-mono rounded border border-[var(--vx-border-soft)] bg-transparent text-[var(--vx-text)] outline-none focus:border-[var(--vx-accent)]"
        />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--vx-border-soft)]">
        <button
          onClick={save}
          disabled={!isDirty && !savedFlash}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-colors"
          style={{
            background: isDirty || savedFlash ? "var(--vx-accent)" : "var(--vx-panel-3)",
            color: isDirty || savedFlash ? "#0A0A0A" : "var(--vx-faint)",
            border: "1px solid var(--vx-accent)",
            cursor: isDirty ? "pointer" : "default",
          }}
        >
          {savedFlash ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {savedFlash ? "Saved!" : "Save"}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--vx-muted)] hover:text-[var(--vx-text)] underline">
          <RotateCcw className="w-3 h-3" /> Reset to default
        </button>
      </div>
    </div>
  );
}