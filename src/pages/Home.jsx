import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Camera, Ruler, Calculator, FileText, FileSignature, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import { projectsFromLeads } from "@/lib/refData";
import { FeatureCard, ProjectRow } from "@/components/vq/ProjectRow";

const TOOLS = [
  { label: "Vizualizer", icon: Camera, to: "/visualizer" },
  { label: "Measure\n& Scope", icon: Ruler, to: "/projects" },
  { label: "Preliminary\nPricing", icon: Calculator, to: "/visualizer" },
  { label: "Proposal", icon: FileText, to: "/close" },
  { label: "e-Sign", icon: FileSignature, to: "/close" },
];

export default function Home() {
  const navigate = useNavigate();
  const { openNewProject, query } = useUI();
  const [projects, setProjects] = useState([]);

  const load = () =>
    base44.entities.Lead.list("-created_date", 50).then((l) => setProjects(projectsFromLeads(l))).catch(() => setProjects([]));

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("xv-projects-changed", handler);
    return () => window.removeEventListener("xv-projects-changed", handler);
  }, []);

  const feature = projects[0];
  const matches = query.trim()
    ? projects.filter((p) => `${p.name} ${p.location} ${p.system}`.toLowerCase().includes(query.toLowerCase()))
    : projects.filter((p) => p.id !== feature?.id);
  const recent = matches.slice(0, 3);

  return (
    <>
      <section className="greeting-row">
        <div className="greeting">
          <h1>Good morning, Mike!</h1>
          <p>Let's turn this visit into a signed job.</p>
        </div>
        <button className="gold-button" onClick={openNewProject}>
          <Plus size={20} /> New Project
        </button>
      </section>

      {feature && !query.trim() && (
        <FeatureCard project={feature} onClick={() => navigate(`/leads/${feature.id}`)} />
      )}

      <section className="section">
        <h2 className="section-title">Close More Jobs</h2>
        <div className="tools-grid">
          {TOOLS.map(({ label, icon: Icon, to }) => (
            <button key={label} className="tool" onClick={() => navigate(to)}>
              <span className="tool-icon">
                <Icon size={32} />
              </span>
              <span className="tool-label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="divider">
        <div className="section-title-row">
          <h2 className="section-title">Recent Projects</h2>
          <button className="text-link" onClick={() => navigate("/projects")}>
            View All <ChevronRight size={19} />
          </button>
        </div>
        <div className="project-list">
          {recent.length ? (
            recent.map((p) => <ProjectRow key={p.id} project={p} onClick={() => navigate(`/leads/${p.id}`)} />)
          ) : (
            <div className="empty">No projects match this search.</div>
          )}
        </div>
      </section>

      <section className="vizzy-card">
        <div className="vizzy-copy">
          <div className="vizzy-mark">
            <Sparkles size={30} color="#e6a90b" />
          </div>
          <div className="vizzy-text">
            <strong>Let Vizzy AI Assistant help you close today.</strong>
            <button onClick={() => navigate("/visualizer")}>
              Ask Vizzy <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}