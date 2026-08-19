import React from "react";

/** @param {{ eyebrow?: string; title: string; description?: string; action?: React.ReactNode; actions?: React.ReactNode }} props */
export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="vx-page-header">
      <div>
        {eyebrow && <span className="vx-kicker">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}