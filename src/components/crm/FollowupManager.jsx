import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, Plus, Clock, Check, Trash2, Zap } from "lucide-react";

export default function FollowupManager({ leads }) {
  const [plans, setPlans] = useState(null);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");

  const [form, setForm] = useState({
    name: "",
    lead_ids: [],
    interval_days: 3,
    max_followups: 4,
    subject_template: "",
    body_template: "",
    use_ai: true,
  });

  const load = () => base44.entities.FollowupPlan.list("-created_date", 50).then(setPlans);
  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleLead = (id) => {
    setForm((p) => {
      const arr = p.lead_ids.includes(id) ? p.lead_ids.filter((x) => x !== id) : [...p.lead_ids, id];
      return { ...p, lead_ids: arr };
    });
  };

  const create = async () => {
    if (!form.name || form.lead_ids.length === 0) return;
    await base44.entities.FollowupPlan.create({
      ...form,
      interval_days: Number(form.interval_days) || 3,
      max_followups: Number(form.max_followups) || 4,
      next_send_date: new Date(Date.now() + (Number(form.interval_days) || 3) * 86400000).toISOString(),
    });
    setForm({ name: "", lead_ids: [], interval_days: 3, max_followups: 4, subject_template: "", body_template: "", use_ai: true });
    setCreating(false);
    load();
  };

  const toggleActive = async (p) => {
    await base44.entities.FollowupPlan.update(p.id, { active: !p.active });
    load();
  };

  const remove = async (p) => {
    await base44.entities.FollowupPlan.delete(p.id);
    load();
  };

  const runNow = async () => {
    setRunning(true);
    setResult("");
    try {
      const res = await base44.functions.invoke("runFollowupPlans", {});
      if (res.data?.error) setResult("Error: " + res.data.error);
      else setResult(`Sent ${res.data?.ok || 0} · Failed ${res.data?.failed || 0} · Skipped ${res.data?.skipped || 0}${res.data?.gmail_connected === false ? " (Gmail not connected — drafts saved)" : ""}`);
    } catch (e) {
      setResult("Error: " + (e?.message || "failed"));
    } finally {
      setRunning(false);
      load();
    }
  };

  return (
    <div className="hx-bid-input-card" style={{ background: "#1A1A1A" }}>
      <div className="hx-section-head">
        <h2 style={{ fontSize: 15 }}>Follow-up System</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="hx-mini-btn dark" disabled={running} onClick={runNow}>
            {running ? <Loader2 size={14} className="spin" /> : <Zap size={14} />} <span>Send due now</span>
          </button>
          <button className="hx-mini-btn" onClick={() => setCreating((v) => !v)}>
            <Plus size={14} /> <span>New plan</span>
          </button>
        </div>
      </div>

      {result && <div className="hx-notice" style={{ fontSize: 11 }}>{result}</div>}

      {creating && (
        <div style={{ display: "grid", gap: 10, padding: 12, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)" }}>
          <input className="hx-scraper-input" placeholder="Plan name (e.g. Garage epoxy Q3)" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <div className="hx-scraper-row">
            <div>
              <label style={{ fontSize: 11, color: "#A0A0A0", fontWeight: 700 }}>Interval (days)</label>
              <input className="hx-scraper-input" type="number" value={form.interval_days} onChange={(e) => set("interval_days", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#A0A0A0", fontWeight: 700 }}>Max follow-ups</label>
              <input className="hx-scraper-input" type="number" value={form.max_followups} onChange={(e) => set("max_followups", e.target.value)} />
            </div>
          </div>
          <input className="hx-scraper-input" placeholder="Subject template (optional — AI fills if blank)" value={form.subject_template} onChange={(e) => set("subject_template", e.target.value)} />
          <textarea className="hx-bid-textarea" placeholder="Body template (optional — AI generates if blank)" value={form.body_template} onChange={(e) => set("body_template", e.target.value)} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#A0A0A0" }}>
            <input type="checkbox" checked={form.use_ai} onChange={(e) => set("use_ai", e.target.checked)} style={{ accentColor: "var(--vx-accent)" }} />
            Use AI to personalize each email
          </label>
          <div style={{ fontSize: 11, color: "#A0A0A0", fontWeight: 700 }}>Select contacts to follow up with:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
            {(leads || []).map((l) => (
              <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", padding: "6px 8px", borderRadius: 8, border: form.lead_ids.includes(l.id) ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)", background: form.lead_ids.includes(l.id) ? "var(--vx-accent-soft)" : "transparent" }}>
                <input type="checkbox" checked={form.lead_ids.includes(l.id)} onChange={() => toggleLead(l.id)} style={{ accentColor: "var(--vx-accent)" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.customer_name}</span>
                <span style={{ color: "#707070", fontSize: 10, marginLeft: "auto" }}>{l.email}</span>
              </label>
            ))}
          </div>
          <button className="hx-mini-btn" disabled={!form.name || form.lead_ids.length === 0} onClick={create}>
            <Check size={14} /> <span>Create plan</span>
          </button>
        </div>
      )}

      {!plans ? (
        <div className="hx-loading"><Loader2 size={18} /></div>
      ) : plans.length === 0 ? (
        <div style={{ fontSize: 12, color: "#707070", padding: 8 }}>No follow-up plans yet. Create one to start automated follow-ups.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {plans.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: 12, borderRadius: 12, border: `1px solid ${p.active ? "var(--vx-accent)" : "var(--vx-border-soft)"}`, background: p.active ? "var(--vx-accent-soft)" : "var(--vx-panel)" }}>
              <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <strong style={{ fontSize: 13, color: "#fff" }}>{p.name}</strong>
                <div style={{ fontSize: 11, color: "#A0A0A0", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span><Clock size={11} style={{ display: "inline", marginRight: 3 }} />{p.interval_days}d interval</span>
                  <span>{p.followups_sent || 0}/{p.max_followups || 4} sent</span>
                  <span>{(p.lead_ids || []).length} contacts</span>
                  {p.next_send_date && <span>next: {new Date(p.next_send_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => toggleActive(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)", color: p.active ? "var(--vx-accent)" : "#707070", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Check size={14} />
                </button>
                <button onClick={() => remove(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)", color: "var(--vx-danger)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}