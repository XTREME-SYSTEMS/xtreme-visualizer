import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, CalendarClock, FileText, DollarSign, TrendingUp, Target, CreditCard, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import AiChat from "@/components/dashboard/AiChat";

const STATUS_COLORS = { new: "#ffd200", qualified: "#43a9ff", estimate_sent: "#9cff00", proposal_sent: "#c4ff3f", won: "#9cff00", lost: "#ff5258", follow_up: "#ffd000" };

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [leads, projects, appts, proposals, assets, events] = await Promise.all([
        base44.entities.Lead.list("-created_date", 200).catch(() => []),
        base44.entities.Project.list("-created_date", 200).catch(() => []),
        base44.entities.Appointment.list("-created_date", 200).catch(() => []),
        base44.entities.Proposal.list("-created_date", 200).catch(() => []),
        base44.entities.MarketingAsset.list("-created_date", 100).catch(() => []),
        base44.entities.TrackingEvent.list("-created_date", 200).catch(() => []),
      ]);
      setData({ leads, projects, appts, proposals, assets, events });
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
                {apptData.map((_, i) => <Cell key={i} fill={["#ffd200", "#9cff00", "#43a9ff", "#ff5258"][i % 4]} />)}
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
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cff00" stopOpacity={0.6} /><stop offset="100%" stopColor="#9cff00" stopOpacity={0.05} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#9cff00" strokeWidth={2} fill="url(#rev)" />
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
              <Bar dataKey="count" fill="#9cff00" radius={[0, 4, 4, 0]} />
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
              <Bar dataKey="won" name="Won" fill="#9cff00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div style={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column" }}>
        <AiChat contextSummary={contextSummary} />
      </div>
    </div>
  );
}