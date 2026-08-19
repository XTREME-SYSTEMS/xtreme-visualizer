import React from "react";

/** @param {{ icon?: React.ComponentType<any>; title: string; hint?: React.ReactNode; children?: React.ReactNode }} props */
export default function EmptyState({ icon: Icon, title, hint, children }) {
  return (
    <div className="vx-empty">
      {Icon && <Icon className="vx-icon vx-icon-lg" style={{ color: "var(--vx-faint)", margin: "0 auto 8px" }} />}
      <strong>{title}</strong>
      {hint && <span style={{ fontSize: 12, color: "var(--vx-muted)" }}>{hint}</span>}
      {children}
    </div>
  );
}