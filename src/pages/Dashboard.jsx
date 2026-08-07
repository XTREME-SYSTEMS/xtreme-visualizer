import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, CalendarClock, FileText, DollarSign, TrendingUp, Target, CreditCard, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import AiChat from "@/components/dashboard/AiChat";
import ProposalInsights from "@/components/dashboard/ProposalInsights";

const STATUS_COLORS = { new: "#ffd200", qualified: "#43a9ff", estimate_sent: "#f0f40b", proposal_sent: "#c4ff3f", won: "#f0f40b", lost: "#ff5258", follow_up: "#ffd000" };

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [leads, projects, appts, proposals, assets, events, workOrders, clockEvents, fieldPhotos, jobCosts] = await Promise.all([
        base44.entities.Lead.list("-created_date", 200).catch(() => []),
        base44.entities.Project.list("-created_date", 200).catch(() => []),
        base44.entities.Appointment.list("-created_date", 200).catch(() => []),
        base44.entities.Proposal.list("-created_date", 200).catch(() => []),
        base44.entities.MarketingAsset.list("-created_date", 100).catch(() => []),
        base44.entities.TrackingEvent.list("-created_date", 200).catch(() => []),
        base44.entities.WorkOrder.list("-created_date", 200).catch(() => []),
        base44.entities.ClockEvent.list("-created_date", 200).catch(() => []),
        base44.entities.FieldPhoto.list("-created_date", 200).catch(() => []),
        base44.entities.JobCost.list("-created_date", 200).catch(() => []),
      ]);
      setData({ leads, projects, appts, proposals, assets, events, workOrders, clockEvents, fieldPhotos, jobCosts });
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;
    const won = data.leads.filter((l) => l.status === "won");
    const revenue = won.reduce((s, l) => s + (l.proposal_total || l.estimate_high || 0), 0);
    const activeProjects = data.projects.filter((p) => ["Active", "Qualified", "Estimate Sent", "Proposal Sent"].includes(p.status));
    return {
      leads: data.leads.length,
      revenue,
      activeProjects: activeProjects.length,
      appts: data.appts.filter((a) => a.status === "confirmed").length,
      proposals: data.proposals.length,
      assets: data.assets.length,
      events: data.events.length,
      won: won.length,
    };
  }, [data]);

  const pipelineData = useMemo(() => {
    if (!data) return [];
    const order = ["new", "qualified", "estimate_sent", "proposal_sent", "follow_up", "won", "lost"];
    return order.map((s) => ({ name: s.replace(/_/g, " "), count: data.leads.filter((l) => (l.status || "new") === s).length, fill: STATUS_COLORS[s] || "#707070" }));
  }, [data]);

  const apptData = useMemo(() => {
    if (!data) return [];
    const order = ["requested", "confirmed", "completed", "cancelled"];
    return order.map((s) => ({ name: s, value: data.appts.filter((a) => a.status === s).length }));
  }, [data]);

  const eventData = useMemo(() => {
    if (!data || !data.events.length) return [];
    const types = {};
    data.events.forEach((e) => { types[e.event_type] = (types[e.event_type] || 0) + 1; });
    return Object.entries(types).map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));
  }, [data]);

  const revenueByMonth = useMemo(() => {
    if (!data) return [];
    const months = {};
    data.leads.filter((l) => l.status === "won" && l.proposal_total).forEach((l) => {
      const m = new Date(l.created_date).toLocaleString("default", { month: "short" });
      months[m] = (months[m] || 0) + l.proposal_total;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [data]);

  const sourceAttribution = useMemo(() => {
    if (!data) return [];
    const sources = {};
    data.leads.forEach((l) => {
      const s = l.source || "manual";
      if (!sources[s]) sources[s] = { total: 0, won: 0, revenue: 0 };
      sources[s].total++;
      if (l.status === "won") {
        sources[s].won++;
        sources[s].revenue += l.proposal_total || l.estimate_high || 0;
      }
    });
    return Object.entries(sources).map(([name, v]) => ({
      name: name.replace(/_/g, " "),
      total: v.total,
      won: v.won,
      rate: v.total > 0 ? Math.round(v.won / v.total * 100) : 0,
      revenue: v.revenue,
    }));
  }, [data]);

  // #14 Price elasticity: estimate range vs proposal_total vs win/loss
  const priceElasticity = useMemo(() => {
    if (!data) return [];
    const withProposals = data.leads.filter((l) => l.proposal_total && l.estimate_high);
    return withProposals.map((l) => {
      const midEstimate = ((l.estimate_low + l.estimate_high) / 2) || 1;
      const ratio = l.proposal_total / midEstimate;
      return {
        name: l.customer_name?.slice(0, 12) || "—",
        estimate: Math.round(midEstimate),
        proposal: l.proposal_total,
        won: l.status === "won",
        ratio: Math.round(ratio * 100),
      };
    }).slice(-15);
  }, [data]);

  // #15 Crew utilization: hours per crew leader this week
  const crewUtilization = useMemo(() => {
    if (!data || !data.clockEvents?.length) return [];
    const weekAgo = Date.now() - 7 * 86400000;
    const crews = {};
    data.clockEvents.forEach((c) => {
      if (!c.clock_in_at) return;
      const cin = new Date(c.clock_in_at).getTime();
      if (cin < weekAgo) return;
      const cout = c.clock_out_at ? new Date(c.clock_out_at).getTime() : Date.now();
      const hours = (cout - cin) / 3600000;
      const name = c.user_name || "Unknown";
      if (!crews[name]) crews[name] = 0;
      crews[name] += hours;
    });
    return Object.entries(crews).map(([name, hours]) => ({ name: name.slice(0, 15), hours: Math.round(hours * 10) / 10 }));
  }, [data]);

  // #16 Photo compliance: % of completed WOs with all 7 photo categories
  const photoCompliance = useMemo(() => {
    if (!data) return { score: 0, total: 0, compliant: 0 };
    const completed = data.workOrders?.filter((w) => w.status === "completed") || [];
    if (completed.length === 0) return { score: 0, total: 0, compliant: 0 };
    const required = ["site_before", "prep", "primer", "base_coat", "color_install", "topcoat", "site_after"];
    const woIds = completed.map((w) => w.id);
    const woPhotos = (data.fieldPhotos || []).filter((p) => woIds.includes(p.work_order_id));
    let compliant = 0;
    completed.forEach((w) => {
      const cats = new Set(woPhotos.filter((p) => p.work_order_id === w.id).map((p) => p.category));
      if (required.every((r) => cats.has(r))) compliant++;
    });
    return { score: Math.round(compliant / completed.length * 100), total: completed.length, compliant };
  }, [data]);

  // #12 Job cost variance: jobs where actual > predicted * 1.15
  const jobCostAlerts = useMemo(() => {
    if (!data || !data.jobCosts?.length) return [];
    return data.jobCosts
      .filter((j) => j.actual_total > 0 && j.predicted_total > 0 && j.actual_total > j.predicted_total * 1.15)
      .map((j) => ({
        name: `JC ${j.id.slice(-4)}`,
        predicted: j.predicted_total,
        actual: j.actual_total,
        variance: Math.round((j.actual_total / j.predicted_total - 1) * 100),
      }));
  }, [data]);

  if (!data || !metrics) return <div className="hx-loading"><Loader2 className="spin" size={26} /></div>;

  const contextSummary = `Business metrics — Leads: ${metrics.leads} total, ${metrics.won} won. Revenue won: $${metrics.revenue.toLocaleString()}. Active projects: ${metrics.activeProjects}. Confirmed appointments: ${metrics.appts}. Proposals: ${metrics.proposals}. Marketing assets: ${metrics.assets}. Tracking events: ${metrics.events}. Pipeline: ${pipelineData.map((p) => `${p.name}=${p.count}`).join(", ")}.`;

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="hx-stat"><Icon size={16} /><strong>{value}</strong><span>{label}</span>{sub && <small>{sub}</small>}</div>
  );

  const ChartCard = ({ title, children, height = 180 }) => (
    <div className="hx-sys-card" style={{ minHeight: 0 }}>
      <h3 style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 8px" }}>{title}</h3>
      <div style={{ height, width: "100%" }}>{children}</div>
    </div>
  );

  return (
    <div className="hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Full business overview, metrics, and AI analysis.</p>
        </div>
      </div>

      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        <StatCard icon={Users} label="Leads" value={metrics.leads} />
        <StatCard icon={DollarSign} label="Revenue Won" value={`$${(metrics.revenue / 1000).toFixed(1)}k`} />
        <StatCard icon={TrendingUp} label="Active Projects" value={metrics.activeProjects} />
        <StatCard icon={CalendarClock} label="Confirmed Appts" value={metrics.appts} />
      </div>
      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        <StatCard icon={FileText} label="Proposals" value={metrics.proposals} />
        <StatCard icon={Target} label="Won" value={metrics.won} />
        <StatCard icon={CreditCard} label="Marketing Assets" value={metrics.assets} />
        <StatCard icon={BarChart3} label="Tracking Events" value={metrics.events} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ChartCard title="Lead Pipeline">
          <ResponsiveContainer>
            <BarChart data={pipelineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Appointments by Status">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={apptData.filter((a) => a.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 9 }}>
                {apptData.map((_, i) => <Cell key={i} fill={["#ffd200", "#f0f40b", "#43a9ff", "#ff5258"][i % 4]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {revenueByMonth.length > 0 && (
        <ChartCard title="Revenue Won by Month">
          <ResponsiveContainer>
            <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f0f40b" stopOpacity={0.6} /><stop offset="100%" stopColor="#f0f40b" stopOpacity={0.05} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#f0f40b" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {eventData.length > 0 && (
        <ChartCard title="Tracking Events">
          <ResponsiveContainer>
            <BarChart data={eventData} layout="vertical" margin={{ top: 4, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} width={80} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#f0f40b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {sourceAttribution.length > 0 && (
        <ChartCard title="Lead Source Attribution">
          <ResponsiveContainer>
            <BarChart data={sourceAttribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} formatter={(v, n) => n === "rate" ? `${v}%` : v} />
              <Bar dataKey="total" name="Total Leads" fill="#43a9ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="Won" fill="#f0f40b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {photoCompliance.total > 0 && (
        <div className="hx-sys-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase", margin: 0 }}>Photo Compliance Score</h3>
            <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: "4px 0 0" }}>{photoCompliance.compliant}/{photoCompliance.total} completed jobs have all 7 required photo categories</p>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: photoCompliance.score >= 80 ? "var(--vx-accent)" : photoCompliance.score >= 50 ? "var(--vx-warning)" : "var(--vx-danger)" }}>
            {photoCompliance.score}%
          </div>
        </div>
      )}

      {priceElasticity.length > 0 && (
        <ChartCard title="Price Elasticity — Estimate vs Proposal">
          <ResponsiveContainer>
            <BarChart data={priceElasticity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="estimate" name="Estimate Mid" fill="#43a9ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="proposal" name="Proposal Total" fill="#f0f40b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {crewUtilization.length > 0 && (
        <ChartCard title="Crew Utilization — Hours This Week">
          <ResponsiveContainer>
            <BarChart data={crewUtilization} layout="vertical" margin={{ top: 4, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} width={80} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v} hrs`} />
              <Bar dataKey="hours" fill="#c4ff3f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {jobCostAlerts.length > 0 && (
        <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 8 }}>
          <h3 style={{ fontSize: 12, color: "var(--vx-danger)", letterSpacing: ".06em", textTransform: "uppercase", margin: 0 }}>⚠ Job Cost Variance Alerts</h3>
          {jobCostAlerts.map((j, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "rgba(255,82,88,.06)", border: "1px solid var(--vx-danger)" }}>
              <strong style={{ fontSize: 12, color: "var(--vx-text)" }}>{j.name}</strong>
              <span style={{ fontSize: 11, color: "var(--vx-danger)", fontWeight: 700 }}>
                ${j.predicted.toLocaleString()} → ${j.actual.toLocaleString()} (+{j.variance}%)
              </span>
            </div>
          ))}
        </div>
      )}

      <ProposalInsights leads={data.leads} />

      <div style={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column" }}>
        <AiChat contextSummary={contextSummary} />
      </div>
    </div>
  );
}