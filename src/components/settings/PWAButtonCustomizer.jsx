import React, { useState } from "react";
import { Download, X, Save, Check, RotateCcw } from "lucide-react";

const STORAGE_KEY = "vx-download-button";

const DEFAULTS = {
  label: "Install Xtreme",
  style: "gradient", // gradient | solid | outline | pill
  colorMode: "accent", // accent | custom
  customFrom: "#FFD60A",
  customTo: "#FFB800",
};

export function getPWAButtonConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

const STYLE_PRESETS = [
  { key: "gradient", label: "Gradient", blurb: "Two-tone gradient bar" },
  { key: "solid", label: "Solid", blurb: "Flat accent fill" },
  { key: "outline", label: "Outline", blurb: "Bordered, transparent fill" },
  { key: "pill", label: "Pill", blurb: "Rounded accent capsule" },
];

function buildStyle(cfg) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: cfg.style === "pill" ? "10px 18px" : "10px 12px 10px 16px",
    borderRadius: cfg.style === "pill" ? 999 : 14,
    maxWidth: "calc(100vw - 32px)",
  };
  if (cfg.colorMode === "accent") {
    if (cfg.style === "outline") {
      return { ...base, background: "transparent", color: "var(--vx-accent)", border: "1px solid var(--vx-accent)", boxShadow: "none" };
    }
    if (cfg.style === "solid" || cfg.style === "pill") {
      return { ...base, background: "var(--vx-accent)", color: "#0A0A0A", border: "1px solid var(--vx-accent)", boxShadow: "0 0 24px rgba(255,214,10,.28)" };
    }
    return { ...base, background: "linear-gradient(135deg, var(--vx-accent), var(--vx-accent-2))", color: "#0A0A0A", border: "1px solid var(--vx-accent)", boxShadow: "0 0 24px rgba(255,214,10,.28), 0 8px 24px rgba(0,0,0,.5)" };
  }
  // custom
  if (cfg.style === "outline") {
    return { ...base, background: "transparent", color: cfg.customFrom, border: `1px solid ${cfg.customFrom}`, boxShadow: "none" };
  }
  if (cfg.style === "solid" || cfg.style === "pill") {
    return { ...base, background: cfg.customFrom, color: "#0A0A0A", border: `1px solid ${cfg.customFrom}`, boxShadow: "0 0 24px rgba(0,0,0,.35)" };
  }
  return { ...base, background: `linear-gradient(135deg, ${cfg.customFrom}, ${cfg.customTo})`, color: "#0A0A0A", border: `1px solid ${cfg.customFrom}`, boxShadow: "0 0 24px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.5)" };
}

function PreviewBar({ cfg }) {
  const barStyle = buildStyle(cfg);
  return (
    <div
      style={{
        position: "relative",
        background: "var(--vx-panel-2)",
        border: "1px solid var(--vx-border-soft)",
        borderRadius: 14,
        padding: "28px 12px",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 120%, rgba(255,255,255,.04), transparent 60%)" }} />
      <div style={barStyle}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: 0,
            color: "inherit",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Download size={18} strokeWidth={2.5} />
          <span>{cfg.label || "Install"}</span>
        </button>
        <button
          aria-label="Dismiss"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            border: 0,
            background: "rgba(0,0,0,.18)",
            color: "inherit",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

export default function PWAButtonCustomizer() {
  const [draft, setDraft] = useState(getPWAButtonConfig);
  const [saved, setSaved] = useState(getPWAButtonConfig);
  const [savedFlash, setSavedFlash] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const update = (patch) => setDraft((p) => ({ ...p, ...patch }));

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
    setSaved(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const reset = () => setDraft(DEFAULTS);

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">Design the install prompt shown to mobile users. Choose <strong>Accent</strong> to match your brand color automatically, or pick custom colors. Press <strong>Save</strong> to apply.</p>

      <PreviewBar cfg={draft} />

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Button label</p>
        <input
          type="text"
          value={draft.label}
          placeholder="Install Xtreme"
          onChange={(e) => update({ label: e.target.value })}
          className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Style</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.key}
              onClick={() => update({ style: s.key })}
              className="text-left px-3 py-2 rounded-lg border text-[12px] transition-colors"
              style={{
                borderColor: draft.style === s.key ? "var(--vx-accent)" : "var(--vx-border-soft)",
                background: draft.style === s.key ? "var(--vx-accent-soft)" : "transparent",
              }}
            >
              <strong className="text-slate-200">{s.label}</strong>
              <span className="block text-[11px] text-slate-500">{s.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Color</p>
        <div className="flex gap-2">
          <button
            onClick={() => update({ colorMode: "accent" })}
            className="flex-1 px-3 py-2 rounded-lg border text-[12px] font-semibold"
            style={{
              borderColor: draft.colorMode === "accent" ? "var(--vx-accent)" : "var(--vx-border-soft)",
              background: draft.colorMode === "accent" ? "var(--vx-accent-soft)" : "transparent",
              color: "var(--vx-text)",
            }}
          >
            Match accent
          </button>
          <button
            onClick={() => update({ colorMode: "custom" })}
            className="flex-1 px-3 py-2 rounded-lg border text-[12px] font-semibold"
            style={{
              borderColor: draft.colorMode === "custom" ? "var(--vx-accent)" : "var(--vx-border-soft)",
              background: draft.colorMode === "custom" ? "var(--vx-accent-soft)" : "transparent",
              color: "var(--vx-text)",
            }}
          >
            Custom colors
          </button>
        </div>
        {draft.colorMode === "custom" && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-[12px] text-slate-500">From</label>
            <input type="color" value={draft.customFrom} onChange={(e) => update({ customFrom: e.target.value })} className="w-9 h-9 rounded cursor-pointer border border-slate-300 bg-transparent p-0" />
            <label className="text-[12px] text-slate-500">To</label>
            <input type="color" value={draft.customTo} onChange={(e) => update({ customTo: e.target.value })} className="w-9 h-9 rounded cursor-pointer border border-slate-300 bg-transparent p-0" />
            {draft.style === "solid" && <span className="text-[11px] text-slate-500">(Solid uses the From color)</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
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
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 underline">
          <RotateCcw className="w-3 h-3" /> Reset to default
        </button>
      </div>
    </div>
  );
}