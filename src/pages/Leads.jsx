import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import { projectsFromLeads } from "@/lib/refData";
import { ProjectRow } from "@/components/vq/ProjectRow";

const GROUPS = ["New Lead", "Viewed", "Estimate Sent", "Proposal Sent"];

export default function Leads() {
  const navigate = useNavigate();
  const { openNewProject } = useUI();
  const [projects, setProjects] = useState([]);

  const load = () =>
    base44.entities.Lead.list("-created_date", 100).then((l) => setProjects(projectsFromLeads(l))).catch(() => setProjects([]));

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("xv-projects-changed", handler);
    return () => window.removeEventListener("xv-projects-changed", handler);
  }, []);

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Lead Pipeline</h1>
          <p>Move opportunities from first contact to signed proposal.</p>
        </div>
        <button className="gold-button" onClick={openNewProject}>
          <Plus size={19} /> Lead
        </button>
      </div>
      <div className="content-card">
        <div className="pipeline">
          {GROUPS.map((group) => (
            <div key={group} className="pipeline-card">
              <strong>{projects.filter((p) => p.status === group).length}</strong>
              <span>{group}</span>
            </div>
          ))}
        </div>
        <div className="project-list">
          {projects.length ? (
            projects.map((p) => <ProjectRow key={p.id} project={p} onClick={() => navigate(`/leads/${p.id}`)} />)
          ) : (
            <div className="empty">No leads yet. Tap Lead to create one.</div>
          )}
        </div>
      </div>
    </>
  );
}