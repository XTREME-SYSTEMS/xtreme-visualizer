import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import CustomerRow from "@/components/vq/CustomerRow";

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
    if (!leads) return { total: 0, new: 0, active: 0, won: 0, value: 0 };
    const total = leads.length;
    const wonCount = leads.filter((l) => l.status === "won").length;
    const newCount = leads.filter((l) => l.status === "new" || !l.status).length;
    const activeCount = leads.filter((l) => ["qualified", "estimate_sent", "proposal_sent", "follow_up"].includes(l.status)).length;
    const value = leads.reduce((sum, l) => sum + (Number(l.proposal_total) || Number(l.estimate_high) || 0), 0);
    return { total, new: newCount, active: activeCount, won: wonCount, value };
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
    <div className="page">
      <PageHeader
        eyebrow="Customer relationship center"
        title="Customers"
        description="Every customer you accumulate through the visualizer, lead generator, and manual entry — all in one pipeline."
        action={
          <button className="gold-button" onClick={openNewProject}>
            <Plus size={19} /> Customer
          </button>
        }
      />

      {/* Pipeline stats */}
      <div className="home-pipeline">
        <div className="home-pipeline-card">
          <strong>{stats.total}</strong>
          <span>Total customers</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.new}</strong>
          <span>New leads</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.active}</strong>
          <span>Active</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.won}</strong>
          <span>Won</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="content-card" style={{ display: "grid", gap: 12 }}>
        <div className="searchbar" style={{ padding: 0, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--vx-faint)" }} />
          <input
            style={{ paddingLeft: 38 }}
            placeholder="Search by name, email, phone, address, system…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                border: "1px solid",
                borderColor: statusFilter === f.key ? "var(--vx-accent)" : "var(--vx-border-soft)",
                background: statusFilter === f.key ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
                color: statusFilter === f.key ? "var(--vx-accent)" : "var(--vx-muted)",
                borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "border-color .12s, background .12s, color .12s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      {leads === null ? (
        <div className="content-card" style={{ display: "grid", placeItems: "center", padding: 40 }}>
          <Loader2 size={24} style={{ color: "var(--vx-accent)", animation: "spin .8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={leads.length === 0 ? "No customers yet" : "No matches"}
          hint={leads.length === 0 ? "Generate a bid from the visualizer or tap Customer to add one." : "Try a different search or filter."}
        />
      ) : (
        <div className="home-bid-list">
          {filtered.map((lead) => (
            <CustomerRow key={lead.id} lead={lead} onClick={() => navigate(`/leads/${lead.id}`)} />
          ))}
        </div>
      )}

      {leads && leads.length > 0 && (
        <p className="home-disclosure">
          {filtered.length} of {leads.length} customers shown · estimated pipeline value{" "}
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stats.value)}
        </p>
      )}
    </div>
  );
}