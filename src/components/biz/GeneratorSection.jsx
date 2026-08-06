import React, { useState } from "react";
import { Loader2, Sparkles, Lock, Check } from "lucide-react";

export default function GeneratorSection({
  index,
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

  return (
    <section className="vx-card" style={{ padding: 18, display: "grid", gap: 14 }}>
      <div>
        <span className="vx-kicker">{tag}</span>
        <h2 style={{ margin: "4px 0 0", fontSize: 20, letterSpacing: "-.02em" }}>
          {index}. {title}
        </h2>
        {description && (
          <p style={{ margin: "6px 0 0", color: "var(--vx-muted)", fontSize: 13, lineHeight: 1.45 }}>{description}</p>
        )}
      </div>

      <button className="vx-btn primary" onClick={run} disabled={!canGenerate || loading} style={{ alignSelf: "flex-start" }}>
        {loading ? <Loader2 className="vx-icon" /> : <Sparkles className="vx-icon" />}
        {loading ? "Generating…" : ctaLabel}
      </button>

      {!canGenerate && lockedMessage && (
        <p style={{ color: "var(--vx-faint)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
          <Lock className="vx-icon-sm" /> {lockedMessage}
        </p>
      )}
      {error && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{error}</p>}

      {options.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {options.map((opt, i) => {
            const active = selectedKey === i;
            return (
              <div
                key={i}
                onClick={() => onSelect(opt, i)}
                style={{
                  cursor: "pointer",
                  border: active ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)",
                  borderRadius: 14,
                  background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)",
                  boxShadow: active ? "var(--vx-glow)" : "none",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {active && (
                  <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 24, height: 24, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center" }}>
                    <Check className="vx-icon-sm" />
                  </span>
                )}
                {renderOption(opt, i, active)}
              </div>
            );
          })}
        </div>
      )}

      {options.length > 0 && selectedKey != null && onSelect && (
        <button
          className="vx-btn outline-accent"
          onClick={() => onSelect(options[selectedKey], selectedKey, true)}
          style={{ alignSelf: "flex-start" }}
        >
          <Check className="vx-icon" /> {savedLabel}
        </button>
      )}
    </section>
  );
}