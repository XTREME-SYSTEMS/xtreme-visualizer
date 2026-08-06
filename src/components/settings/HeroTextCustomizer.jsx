import React, { useState } from "react";
import { Save, Check, RotateCcw } from "lucide-react";

const STORAGE_KEY = "vx-hero-text";

const FONT_PRESETS = [
  { key: "system", label: "System", stack: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Inter, sans-serif" },
  { key: "sans", label: "Sans", stack: "\"Helvetica Neue\", Arial, sans-serif" },
  { key: "serif", label: "Serif", stack: "Georgia, \"Times New Roman\", serif" },
  { key: "mono", label: "Mono", stack: "\"SF Mono\", Menlo, Consolas, monospace" },
  { key: "rounded", label: "Rounded", stack: "\"Avenir Next\", \"Avenir\", \"Segoe UI\", sans-serif" },
  { key: "display", label: "Display", stack: "Impact, \"Arial Narrow Bold\", sans-serif" },
];

const DEFAULTS = {
  headingLine1: "Visualize Floors.",
  headingLine2: "Close Jobs Faster.",
  subheading: "Stunning floor previews. Accurate quotes. More wins.",
  buttonLabel: "New Visualization",
  fontFamily: "system",
  headingColor: "",
  subheadingColor: "",
  buttonColor: "",
};

export function getHeroTextConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function fontStack(key) {
  return FONT_PRESETS.find((f) => f.key === key)?.stack || FONT_PRESETS[0].stack;
}

function Preview({ cfg }) {
  const family = fontStack(cfg.fontFamily);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--vx-border-soft)",
        height: 180,
        background: "linear-gradient(135deg, #1a1a1a, #050505)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(255,214,10,.12), transparent 60%)" }} />
      <div style={{ position: "absolute", left: 18, top: 22, right: 18 }}>
        <h1 style={{ fontFamily: family, color: cfg.headingColor || "#fff", fontSize: 22, lineHeight: 1.1, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
          {cfg.headingLine1 || "—"}
          <br />
          <span style={{ color: cfg.headingColor ? undefined : "var(--vx-accent)" }}>{cfg.headingLine2 || ""}</span>
        </h1>
        <p style={{ fontFamily: family, color: cfg.subheadingColor || "rgba(255,255,255,.85)", fontSize: 11, marginTop: 8, marginBottom: 14 }}>
          {cfg.subheading || ""}
        </p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: family,
            color: cfg.buttonColor || "#0A0A0A",
            background: "var(--vx-accent)",
            padding: "6px 12px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {cfg.buttonLabel || "Button"}
        </span>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[12px] text-slate-500 w-20 shrink-0">{label}</label>
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-slate-300 bg-transparent p-0"
      />
      <input
        type="text"
        value={value}
        placeholder="Default"
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 text-[12px] font-mono rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-[11px] text-slate-500 hover:text-slate-700 underline shrink-0">
          Clear
        </button>
      )}
    </div>
  );
}

export default function HeroTextCustomizer() {
  const [draft, setDraft] = useState(getHeroTextConfig);
  const [saved, setSaved] = useState(getHeroTextConfig);
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
      <p className="text-[12px] text-slate-500">Edit the Home hero copy, fonts, and colors. Leave a color field empty to use the default. Press <strong>Save</strong> to apply.</p>

      <Preview cfg={draft} />

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Heading</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={draft.headingLine1}
            placeholder="Line 1"
            onChange={(e) => update({ headingLine1: e.target.value })}
            className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
          />
          <input
            type="text"
            value={draft.headingLine2}
            placeholder="Line 2 (accent)"
            onChange={(e) => update({ headingLine2: e.target.value })}
            className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Subheading</p>
        <textarea
          value={draft.subheading}
          placeholder="Subheading text"
          onChange={(e) => update({ subheading: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)] resize-none"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Hero button label</p>
        <input
          type="text"
          value={draft.buttonLabel}
          placeholder="Button label"
          onChange={(e) => update({ buttonLabel: e.target.value })}
          className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Font style</p>
        <div className="grid grid-cols-3 gap-2">
          {FONT_PRESETS.map((f) => (
            <button
              key={f.key}
              onClick={() => update({ fontFamily: f.key })}
              className="px-2 py-2 rounded-lg border text-[12px] transition-colors"
              style={{
                fontFamily: f.stack,
                borderColor: draft.fontFamily === f.key ? "var(--vx-accent)" : "var(--vx-border-soft)",
                background: draft.fontFamily === f.key ? "var(--vx-accent-soft)" : "transparent",
                color: "var(--vx-text)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Colors</p>
        <ColorField label="Heading" value={draft.headingColor} onChange={(v) => update({ headingColor: v })} />
        <ColorField label="Subheading" value={draft.subheadingColor} onChange={(v) => update({ subheadingColor: v })} />
        <ColorField label="Button text" value={draft.buttonColor} onChange={(v) => update({ buttonColor: v })} />
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