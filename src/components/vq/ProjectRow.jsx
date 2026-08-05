import React from "react";

export default function ProjectRow({ project, onClick }) {
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