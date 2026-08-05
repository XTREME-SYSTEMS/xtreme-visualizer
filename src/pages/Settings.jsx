import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Moon, Sun, ShieldAlert } from "lucide-react";
import { Card, Chip, Kicker, Notice, PageHeader, Btn } from "@/components/vx/Primitives";
import { useVisualX } from "@/components/vx/VisualXContext";

export default function Settings() {
  const { theme, setTheme } = useVisualX();
  const [flags, setFlags] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    (async () => {
      const [f, r] = await Promise.all([
        base44.entities.FeatureFlag.list("key", 30),
        base44.entities.ActivityReceipt.list("-created_date", 15),
      ]);
      setFlags(f);
      setReceipts(r);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Runtime Controls" subtitle="Guardrails · audit · theme" />

      <Card className="flex items-center justify-between gap-3">
        <div>
          <Kicker>Appearance</Kicker>
          <p className="text-xs" style={{ color: "var(--vx-muted)" }}>
            Dark is the default theme.
          </p>
        </div>
        <Btn variant="outline" className="px-3 py-2 text-xs" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light" : "Dark"}
        </Btn>
      </Card>

      <Kicker>External-action boundary</Kicker>
      <Card className="space-y-2">
        {flags.map((flag) => (
          <div key={flag.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "var(--vx-border-soft)" }}>
            <div className="min-w-0">
              <strong className="block text-xs" style={{ color: "var(--vx-text)" }}>
                {flag.label || flag.key}
              </strong>
              <span className="text-[10px]" style={{ color: "var(--vx-faint)" }}>
                {flag.blocked_reason}
              </span>
            </div>
            <Chip tone={flag.enabled ? "ready" : "danger"}>{flag.enabled ? "Enabled" : "Disabled"}</Chip>
          </div>
        ))}
        {!flags.length ? (
          <span className="text-xs" style={{ color: "var(--vx-faint)" }}>
            No flags recorded.
          </span>
        ) : null}
      </Card>

      <Kicker>Recent audit receipts</Kicker>
      <Card className="space-y-2">
        {receipts.length ? (
          receipts.map((r) => (
            <div key={r.id} className="border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "var(--vx-border-soft)" }}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs" style={{ color: "var(--vx-text)" }}>
                  {r.action}
                </strong>
                <Chip tone="progress">{r.category}</Chip>
              </div>
              <p className="text-[10px]" style={{ color: "var(--vx-muted)" }}>
                {r.detail}
              </p>
              <p className="text-[10px]" style={{ color: "var(--vx-faint)" }}>
                {new Date(r.created_date).toLocaleString()} · rollback: {r.rollback_hint}
              </p>
            </div>
          ))
        ) : (
          <span className="text-xs" style={{ color: "var(--vx-faint)" }}>
            No receipts yet. Consequential writes create one automatically.
          </span>
        )}
      </Card>

      <Notice>
        <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
        Normal runtime starts with no demonstration customers, projects, quotes, proposals, or opportunities. Only the
        verified color chart and floor-system templates are preloaded.
      </Notice>
    </div>
  );
}