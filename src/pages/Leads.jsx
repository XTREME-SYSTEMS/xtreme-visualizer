import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "estimate_sent", label: "Estimate" },
  { key: "proposal_sent", label: "Proposal" },
  { key: "follow_up", label: "Follow Up" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const STATUS_MAP = {
  new: { label: "New", cls: "ready" },
  qualified: { label: "Ready to Quote", cls: "ready" },
  estimate_sent: { label: "Estimate Sent", cls: "progress" },
  proposal_sent: { label: "Proposal Sent", cls: "progress" },
  won: { label: "Won", cls: "ready" },
  lost: { label: "Lost", cls: "blocked" },
  follow_up: { label: "Draft", cls: "draft" },
};

export default function Leads() {
  const navigate = useNavigate();
  const { openNewProject } = useUI();
  const [leads, setLeads] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () =>
    base44.entities.Lead.list("-created_date", 200).then(setLeads).catch(() => setLeads([]));

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("xv-projects-changed", handler);
    return () => window.removeEventListener("xv-projects-changed", handler);
  }, []);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, new: 0, active: 0, won: 0 };
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === "new" || !l.status).length,
      active: leads.filter((l) => ["qualified", "estimate_sent", "proposal_sent", "follow_up"].includes(l.status)).length,
      won: leads.filter((l) => l.status === "won").length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && (l.status || "new") !== statusFilter) return false;
      if (!q) return true;
      return [l.customer_name, l.email, l.phone, l.project_address, l.system_name, l.floor_type]
        .filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>Customers</h1>
          <p>Every customer from the visualizer, lead generator, and manual entry.</p>
        </div>
        <button className="hx-mini-btn" onClick={openNewProject}>
          <Plus size={16} /> <span>Customer</span>
        </button>
      </div>

      <div className="hx-stats hx-stats-4">
        <div className="hx-stat"><strong>{stats.total}</strong><span>Total</span></div>
        <div className="hx-stat"><strong>{stats.new}</strong><span>New</span></div>
        <div className="hx-stat"><strong>{stats.active}</strong><span>Active</span></div>
        <div className="hx-stat"><strong>{stats.won}</strong><span>Won</span></div>
      </div>

      <div className="hx-search-card">
        <div className="hx-search">
          <Search size={16} />
          <input placeholder="Search name, email, address, system…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="hx-filters">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} className={statusFilter === f.key ? "active" : ""} onClick={() => setStatusFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {leads === null ? (
        <div className="hx-loading"><Loader2 size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="hx-empty">
          <div>
            <span>0</span>
            {leads.length === 0 ? "No customers yet. Add one or generate a bid." : "No matches found."}
          </div>
        </div>
      ) : (
        <div className="hx-list">
          {filtered.map((lead) => {
            const badge = STATUS_MAP[lead.status] || { label: lead.status, cls: "ready" };
            return (
              <button key={lead.id} className="hx-project-row" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="hx-project-thumb">
                  {lead.photo_url ? <img src={lead.photo_url} alt="" /> : <Users size={18} />}
                </div>
                <div className="hx-project-info">
                  <strong>{lead.customer_name || "Untitled"}</strong>
                  <small>{lead.project_address || "No address"}</small>
                  <small className="hx-sqft">{lead.square_feet ? `${lead.square_feet.toLocaleString()} sq ft` : "—"}</small>
                </div>
                <div className="hx-project-side">
                  <span className={`vx-chip ${badge.cls}`}>{badge.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}