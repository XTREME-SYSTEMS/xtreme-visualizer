import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function ResponsiveSelect({ value, onValueChange, options, className = "", placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`vx-select-trigger ${className}`} style={{ position: "relative", cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
      <ChevronDown className="vx-icon vx-icon-sm" style={{ flexShrink: 0 }} />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "var(--vx-panel)", border: "1px solid var(--vx-border)", borderRadius: 12, padding: 6, maxHeight: 240, overflow: "auto" }} className="vx-scroll">
          {options.map((o) => (
            <button
              key={o.value}
              className={`vx-select-option ${o.value === value ? "active" : ""}`}
              style={{ width: "100%", minHeight: 40 }}
              onClick={(e) => { e.stopPropagation(); onValueChange?.(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check className="vx-icon vx-icon-sm" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}