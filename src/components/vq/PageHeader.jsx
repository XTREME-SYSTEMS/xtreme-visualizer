import React from "react";

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