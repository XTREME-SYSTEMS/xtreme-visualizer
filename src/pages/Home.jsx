import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Plus, ScanLine, Columns2, Tag, Send, Box, Receipt } from "lucide-react";
import { Card, Chip, EmptyState, Kicker, SectionTitle, Btn } from "@/components/vx/Primitives";

const QUICK = [
  { to: "/app/scan", icon: ScanLine, label: "Scan\nSpace" },
  { to: "/app/compare", icon: Columns2, label: "Compare\nFinishes" },
  { to: "/app/quote", icon: Tag, label: "Quote\nRange" },
  { to: "/app/proposal", icon: Send, label: "Share\nProposal" },
];

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [counts, setCounts] = useState({ quotes: 0, proposals: 0 });

  useEffect(() => {
    (async () => {
      const [p, q, pr] = await Promise.all([
        base44.entities.Project.list("-updated_date", 10),
        base44.entities.Quote.list("-updated_date", 50),
        base44.entities.Proposal.list("-updated_date", 50),
      ]);
      setProjects(p);
      setCounts({ quotes: q.length, proposals: pr.length });
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-[var(--vx-radius)] border p-5"
        style={{
          borderColor: "var(--vx-border-soft)",
          background:
            "radial-gradient(120% 120% at 85% 10%, rgba(156,255,0,0.18) 0%, transparent 55%), linear-gradient(180deg, var(--vx-panel-2), var(--vx-panel))",
        }}
      >
        <h1 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: "var(--vx-text)" }}>
          Visualize Floors.
          <span className="block" style={{ color: "var(--vx-accent)" }}>
            Close Jobs Faster.
          </span>
        </h1>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--vx-muted)" }}>
          Operator-controlled floor previews.
          <br />
          Internal estimates. Verified records only.
        </p>
        <Btn className="mt-4 w-full" onClick={() => navigate("/app/scan")}>
          <Plus className="h-4 w-4" /> New Visualization <ArrowRight className="h-3.5 w-3.5" />
        </Btn>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {QUICK.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-2xl border px-1 py-3 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide"
            style={{
              borderColor: "var(--vx-border-soft)",
              background: "var(--vx-panel)",
              color: "var(--vx-muted)",
              whiteSpace: "pre-line",
            }}
          >
            <Icon className="h-5 w-5" style={{ color: "var(--vx-accent)" }} />
            {label}
          </Link>
        ))}
      </div>

      <SectionTitle
        action={
          <Link to="/app/lead" className="text-[11px] font-semibold" style={{ color: "var(--vx-accent)" }}>
            Leads →
          </Link>
        }
      >
        Recent Projects
      </SectionTitle>

      {projects === null ? (
        <Card className="text-xs" style={{ color: "var(--vx-faint)" }}>
          Loading verified records…
        </Card>
      ) : projects.length ? (
        <Card className="divide-y p-0" style={{ borderColor: "var(--vx-border-soft)" }}>
          {projects.slice(0, 5).map((p) => (
            <article key={p.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold" style={{ color: "var(--vx-text)" }}>
                  {p.name}
                </h3>
                <p className="truncate text-[11px]" style={{ color: "var(--vx-muted)" }}>
                  {p.address || p.location || "Address not recorded"}
                </p>
                <p className="text-[11px]" style={{ color: "var(--vx-faint)" }}>
                  {Number(p.square_feet || 0).toLocaleString()} sq ft
                </p>
              </div>
              <Chip tone={p.status === "Won" ? "ready" : p.status === "Lost" ? "danger" : "progress"}>
                {p.status}
              </Chip>
            </article>
          ))}
        </Card>
      ) : (
        <EmptyState
          title="No verified projects yet"
          text="Create a lead or project to begin. Normal runtime does not invent project records."
          action={
            <Btn variant="outline" className="mt-1" onClick={() => navigate("/app/lead")}>
              <Plus className="h-4 w-4" /> Create Lead
            </Btn>
          }
        />
      )}

      <Card className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Box, value: projects?.length || 0, label: "Projects", note: "Verified runtime" },
          { icon: Receipt, value: counts.quotes, label: "Draft Quotes", note: "Audit tracked" },
          { icon: Send, value: counts.proposals, label: "Proposals", note: "Delivery gated" },
        ].map(({ icon: Icon, value, label, note }) => (
          <div key={label} className="space-y-1">
            <Icon className="mx-auto h-4 w-4" style={{ color: "var(--vx-accent)" }} />
            <strong className="block text-lg" style={{ color: "var(--vx-text)" }}>
              {value}
            </strong>
            <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--vx-muted)" }}>
              {label}
            </span>
            <Kicker>{note}</Kicker>
          </div>
        ))}
      </Card>
    </div>
  );
}