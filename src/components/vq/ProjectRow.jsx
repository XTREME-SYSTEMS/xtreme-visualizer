import React from "react";

export function ProjectRow({ project, onClick }) {
  return (
    <div className="project-row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {project.image ? (
        <img className="project-thumb" src={project.image} alt="" />
      ) : (
        <div className="project-thumb" style={{ background: "var(--vx-panel-3)", display: "grid", placeItems: "center", color: "var(--vx-faint)" }}>—</div>
      )}
      <div>
        <h3>{project.name}</h3>
        <p>{project.location}</p>
        <span className="vx-chip ready">{project.status}</span>
      </div>
      <div className="project-side">
        <time>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : ""}</time>
      </div>
    </div>
  );
}

export function FeatureCard({ project, onClick }) {
  return (
    <div className="feature-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div>
        <span className="vx-kicker">FEATURED PROJECT</span>
        <h3>{project.name}</h3>
        <p>{project.location} · {project.system}</p>
      </div>
      {project.image ? (
        <img src={project.image} alt={project.name} />
      ) : (
        <div style={{ width: 140, height: 96, borderRadius: 12, background: "var(--vx-panel-3)", display: "grid", placeItems: "center", color: "var(--vx-faint)" }}>—</div>
      )}
    </div>
  );
}

export default ProjectRow;