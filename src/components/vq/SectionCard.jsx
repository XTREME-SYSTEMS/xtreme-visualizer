import React from "react";

/** @param {{ title: string; action?: React.ReactNode; children?: React.ReactNode; className?: string; style?: React.CSSProperties; [key: string]: any }} props */
export default function SectionCard({ title, action, children, className = "", style = {}, ...rest }) {
  return (
    <div className={`vx-card ${className}`} style={{ padding: 15, ...style }} {...rest}>
      {(title || action) && (
        <div className="vx-section-title" style={{ marginBottom: 12 }}>
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}