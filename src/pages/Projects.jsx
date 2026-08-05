import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import { projectsFromLeads, money } from "@/lib/refData";
import { ProjectRow } from "@/components/vq/ProjectRow";

export default function Projects() {
  const navigate = useNavigate();
  const { openNewProject, query } = useUI();
  const [projects, setProjects] = useState([]);

  const load = () =>
    base44.entities.Lead.list("-created_date", 100).then((l) => setProjects(projectsFromLeads(l))).catch(() => setProjects([]));

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("xv-projects-changed", handler);
    return () => window.removeEventListener("xv-projects-changed", handler);
  }, []);

  const matches = query.trim()
    ? projects.filter((p) => `${p.name} ${p.location} ${p.system}`.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const proposals = projects.filter((p) => p.status.includes("Proposal")).length;
  const estimates = projects.filter((p) => p.status.includes("Estimate")).length;
  const pipelineHigh = projects.reduce((s, p) => s + (p.high || 0), 0);

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Projects</h1>
          <p>Every opportunity from photo capture through signed proposal.</p>
        </div>
        <button className="gold-button" onClick={openNewProject}>
          <Plus size={19} /> New
        </button>
      </div>
      <div className="content-card">
        <div className="pipeline">
          <div className="pipeline-card">
            <strong>{projects.length}</strong>
            <span>Active projects</span>
          </div>
          <div className="pipeline-card">
            <strong>{proposals}</strong>
            <span>Proposals sent</span>
          </div>
          <div className="pipeline-card">
            <strong>{estimates}</strong>
            <span>Estimates sent</span>
          </div>
          <div className="pipeline-card">
            <strong>{money.format(pipelineHigh)}</strong>
            <span>Pipeline high</span>
          </div>
        </div>
        <div className="project-list">
          {matches.length ? (
            matches.map((p) => <ProjectRow key={p.id} project={p} onClick={() => navigate(`/leads/${p.id}`)} />)
          ) : (
            <div className="empty">No projects yet. Tap New to start one.</div>
          )}
        </div>
      </div>
    </>
  );
}