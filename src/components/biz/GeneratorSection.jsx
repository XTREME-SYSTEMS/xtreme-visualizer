import React, { useState } from "react";
import { Loader2, Sparkles, Lock, Check } from "lucide-react";

export default function GeneratorSection({
  index,
  icon: Icon,
  title,
  description,
  tag,
  canGenerate = true,
  lockedMessage,
  generate,
  renderOption,
  selectedKey,
  onSelect,
  savedLabel = "Save & continue",
  ctaLabel = "Generate 3 options",
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError("");
    try {
      const opts = await generate();
      setOptions(Array.isArray(opts) ? opts : []);
    } catch (e) {
      setError(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const numColor = canGenerate ? "var(--vx-accent)" : "var(--vx-faint)";
  const numBorder = canGenerate ? "#7a7e08" : "var(--vx-border-soft)";
  const numBg = canGenerate ? "var(--vx-accent-soft)" : "var(--vx-panel)";
  const numShadow = canGenerate ? "var(--vx-glow)" : "none";

  return (
    <section className="vx-card" style={{ padding: 20, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", color: numColor, border: "1px solid " + numBorder, background: numBg, boxShadow: numShadow }}>
          {Icon ? <Icon style={{ width: 22, height: 22 }} /> : <strong style={{ fontSize: 15 }}>{index}</strong>}
        </span>
        <div style={{ minWidth: 0 }}>
          <span className="vx-kicker">{tag}</span>
          <h2 style={{ margin: "3px 0 0", fontSize: 19, letterSpacing: "-.02em" }}>{title}</h2>
          {description && <p style={{ margin: "5px 0 0", color: "var(--vx-muted)", fontSize: 12.5, lineHeight: 1.45 }}>{description}</p>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button className="vx-btn primary" onClick={run} disabled={!canGenerate || loading}>
          {loading ? <Loader2 className="vx-icon" /> : <Sparkles className="vx-icon" />}
          {loading ? "Generating…" : ctaLabel}
        </button>
        {!canGenerate && lockedMessage && (
          <span style={{ fontSize: 12, color: "var(--vx-faint)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Lock className="vx-icon-sm" /> {lockedMessage}
          </span>
        )}
      </div>

      {error && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{error}</p>}

      {options.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {options.map((opt, i) => {
            const active = selectedKey === i;
            return (
              <div
                key={i}
                onClick={() => onSelect(opt, i)}
                style={{
                  cursor: "pointer",
                  border: active ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)",
                  borderRadius: 15,
                  background: active ? "linear-gradient(160deg, var(--vx-accent-soft), var(--vx-panel))" : "var(--vx-panel)",
                  boxShadow: active ? "var(--vx-glow)" : "inset 0 1px rgba(255,255,255,.025)",
                  overflow: "hidden",
                  position: "relative",
                  transition: "border-color .15s, box-shadow .15s, background .15s",
                }}
              >
                {active && (
                  <span style={{ position: "absolute", top: 12, right: 12, zIndex: 2, width: 26, height: 26, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center", boxShadow: "var(--vx-glow)" }}>
                    <Check style={{ width: 15, height: 15 }} />
                  </span>
                )}
                {renderOption(opt, i, active)}
              </div>
            );
          })}
        </div>
      )}

      {options.length > 0 && selectedKey != null && onSelect && (
        <button className="vx-btn outline-accent" onClick={() => onSelect(options[selectedKey], selectedKey, true)} style={{ alignSelf: "flex-start" }}>
          <Check className="vx-icon" /> {savedLabel}
        </button>
      )}
    </section>
  );
}