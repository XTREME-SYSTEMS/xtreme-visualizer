import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Save, Wand2, Loader2, UserPlus } from "lucide-react";
import { Card, Chip, EmptyState, Kicker, Notice, PageHeader, Btn, Field } from "@/components/vx/Primitives";
import { useVisualX } from "@/components/vx/VisualXContext";
import { DEFAULT_TASKS, receipt } from "@/lib/vx";

const SPACE_TYPES = ["garage", "basement", "warehouse", "showroom", "patio", "commercial_kitchen", "retail", "other"];
const STATUSES = ["new", "qualified", "estimate_sent", "proposal_sent", "won", "lost", "follow_up"];

export default function LeadPage() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [leads, setLeads] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.Lead.list("-updated_date", 25);
      setLeads(list);
      const active = list.find((l) => l.id === session.leadId) || list[0] || null;
      setDraft(active);
      if (active) patch({ leadId: active.id });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () =>
    setDraft({
      customer_name: "",
      email: "",
      phone: "",
      project_address: "",
      space_type: session.spacePreset || "garage",
      square_feet: session.squareFeet || 0,
      condition: "fair",
      status: "new",
      source: "onsite",
      follow_up_stage: "not_started",
      tasks: DEFAULT_TASKS,
      photo_url: session.photoUrl || "",
    });

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setBusy(true);
    const payload = { ...draft, photo_url: draft.photo_url || session.photoUrl || undefined };
    const saved = draft.id
      ? await base44.entities.Lead.update(draft.id, payload)
      : await base44.entities.Lead.create(payload);
    setDraft(saved);
    patch({ leadId: saved.id });
    setLeads(await base44.entities.Lead.list("-updated_date", 25));
    await receipt({
      action: draft.id ? "lead_updated" : "lead_created",
      detail: `Operator-entered lead ${saved.id} saved.`,
      category: "lead",
      lead_id: saved.id,
    });
    setBusy(false);
  };

  const toggleTask = (index) => {
    const tasks = (draft.tasks || DEFAULT_TASKS).map((t, i) => (i === index ? { ...t, done: !t.done } : t));
    set("tasks", tasks);
  };

  if (loading) {
    return (
      <Card className="text-xs" style={{ color: "var(--vx-faint)" }}>
        Loading leads…
      </Card>
    );
  }

  if (!draft) {
    return (
      <div className="space-y-4">
        <PageHeader title="Onsite Lead Capture" subtitle="Operator entered records only" />
        <EmptyState
          title="No lead selected"
          text="Enter verified contact information collected by the operator. No customer record is invented."
          action={
            <Btn className="mt-1" onClick={startNew}>
              <UserPlus className="h-4 w-4" /> Add Lead
            </Btn>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Onsite Lead Capture"
        subtitle={draft.id ? `Lead ${draft.id.slice(-6)}` : "New lead"}
        action={
          <Btn variant="outline" className="px-3 py-2 text-xs" onClick={startNew}>
            <Plus className="h-3.5 w-3.5" /> New
          </Btn>
        }
      />

      {leads.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1 vx-scroll">
          {leads.map((l) => {
            const active = l.id === draft.id;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setDraft(l);
                  patch({ leadId: l.id });
                }}
                className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  borderColor: active ? "var(--vx-accent)" : "var(--vx-border-soft)",
                  color: active ? "var(--vx-accent)" : "var(--vx-muted)",
                  background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)",
                }}
              >
                {l.customer_name || "Unnamed"}
              </button>
            );
          })}
        </div>
      ) : null}

      <Card className="space-y-2">
        <Kicker>Contact</Kicker>
        <input className="vx-input" value={draft.customer_name || ""} placeholder="Customer name" onChange={(e) => set("customer_name", e.target.value)} />
        <input className="vx-input" value={draft.phone || ""} placeholder="Phone" onChange={(e) => set("phone", e.target.value)} />
        <input className="vx-input" value={draft.email || ""} placeholder="Email" onChange={(e) => set("email", e.target.value)} />
        <input className="vx-input" value={draft.project_address || ""} placeholder="Project address" onChange={(e) => set("project_address", e.target.value)} />
      </Card>

      <Card className="grid grid-cols-2 gap-2">
        <Field label="Space type">
          <select className="vx-input" value={draft.space_type || "garage"} onChange={(e) => set("space_type", e.target.value)}>
            {SPACE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Square feet">
          <input className="vx-input" type="number" value={draft.square_feet ?? ""} onChange={(e) => set("square_feet", Number(e.target.value))} />
        </Field>
        <Field label="Slab condition">
          <select className="vx-input" value={draft.condition || "fair"} onChange={(e) => set("condition", e.target.value)}>
            {["good", "fair", "poor"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="vx-input" value={draft.status || "new"} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="space-y-2">
        <Kicker>Site notes</Kicker>
        <textarea
          className="vx-input min-h-24"
          value={draft.notes || ""}
          placeholder="Cracks, spalls, moisture, access, containment"
          onChange={(e) => set("notes", e.target.value)}
        />
      </Card>

      <Kicker>Follow-up tasks</Kicker>
      <Card className="space-y-2">
        {(draft.tasks || DEFAULT_TASKS).map((task, i) => (
          <label key={i} className="flex items-center gap-3 text-xs" style={{ color: "var(--vx-muted)" }}>
            <input
              type="checkbox"
              checked={!!task.done}
              onChange={() => toggleTask(i)}
              className="h-4 w-4 accent-[#9cff00]"
            />
            <span className="flex-1">{task.label}</span>
            <Chip tone={task.done ? "ready" : "draft"}>{task.done ? "Complete" : "Pending"}</Chip>
          </label>
        ))}
      </Card>

      <Card className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold"
          style={{ background: "var(--vx-accent-soft)", color: "var(--vx-accent)" }}
        >
          {draft.status === "won" ? "WON" : draft.status === "new" ? "NEW" : "•"}
        </div>
        <div className="min-w-0 flex-1">
          <Kicker>Next best action</Kicker>
          <p className="text-[11px]" style={{ color: "var(--vx-muted)" }}>
            Prepare a manual visualization and an internal estimate. Automated follow-up messaging is disabled.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" onClick={save} disabled={busy || !draft.customer_name}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Lead
        </Btn>
        <Btn onClick={() => navigate("/app/scan")}>
          <Wand2 className="h-4 w-4" /> Start Visual
        </Btn>
      </div>

      <Notice>
        Automated customer email, SMS, and follow-up sequences are disabled. Every field here is operator entered and
        written with an audit receipt.
      </Notice>
    </div>
  );
}