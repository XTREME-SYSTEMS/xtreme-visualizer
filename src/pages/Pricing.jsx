import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import { systemRates } from "@/lib/refData";
import { computeRange, money } from "@/lib/pricing";
import { Loader2, Calculator, Plus, Search, MapPin, TrendingUp, Check } from "lucide-react";

const RATE_FIELDS = [
  ["mobilization_fee", "Mobilization fee ($)", "number"],
  ["min_job_price", "Minimum job price ($)", "number"],
  ["prep_grinding_rate", "Grinding prep ($/sqft)", "number"],
  ["moisture_mitigation_rate", "Moisture mitigation ($/sqft)", "number"],
  ["crack_repair_rate", "Crack repair ($/lf)", "number"],
  ["coving_rate", "Coving ($/lf)", "number"],
  ["joint_filler_rate", "Joint filler ($/lf)", "number"],
  ["patch_rate", "Patch repair ($/each)", "number"],
  ["excess_patch_rate", "Excess patch ($/each)", "number"],
  ["large_patch_rate", "Large patch / deep spall ($/each)", "number"],
  ["demolition_rate", "Demolition ($/sqft)", "number"],
  ["extra_prep_rate", "Extra site prep (flat $)", "number"],
  ["range_spread_pct", "Range spread (0.15 = 15%)", "number"],
];

const SYSTEM_OPTIONS = Object.keys(systemRates).filter((s) => s !== "Joint Fill & Repair");

export default function Pricing() {
  const [rules, setRules] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zip, setZip] = useState("");
  const [lookupSystem, setLookupSystem] = useState("Flake Epoxy");
  const [looking, setLooking] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [lookupErr, setLookupErr] = useState("");

  const load = () => base44.entities.PricingRule.list("-created_date", 50).then(setRules);
  useEffect(() => { load(); }, []);

  const active = useMemo(() => rules?.find((r) => r.status === "active"), [rules]);

  const fixture = active
    ? computeRange({ square_feet: 500, condition: "fair", needs_grinding: true, linear_feet_cracks: 20, base_rate_low: 5, base_rate_high: 10 }, active)
    : null;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      RATE_FIELDS.forEach(([k, , type]) => (payload[k] = type === "number" ? Number(draft[k]) || 0 : draft[k]));
      payload.notes = draft.notes || "";
      payload.status = draft.status || "draft";
      if (draft.id) await base44.entities.PricingRule.update(draft.id, payload);
      else await base44.entities.PricingRule.create(payload);
      setDraft(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const activate = async (rule) => {
    await Promise.all((rules || []).filter((r) => r.status === "active").map((r) => base44.entities.PricingRule.update(r.id, { status: "archived" })));
    await base44.entities.PricingRule.update(rule.id, { status: "active" });
    await base44.entities.ActivityReceipt.create({ actor: "Contractor", action: `Pricing rules ${rule.version} activated`, category: "audit" });
    load();
  };

  const runLookup = async () => {
    if (!zip || zip.length < 5) { setLookupErr("Enter a valid 5-digit ZIP code."); return; }
    setLooking(true); setLookupErr(""); setLookup(null);
    try {
      const res = await base44.functions.invoke("fetchLocalPricing", { zipCode: zip, systemName: lookupSystem });
      setLookup(res.data);
    } catch (err) {
      setLookupErr(err?.response?.data?.error || err?.message || "Lookup failed");
    } finally {
      setLooking(false);
    }
  };

  if (!rules) {
    return (
      <div className="py-24 grid place-items-center" style={{ color: "var(--vx-muted)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--vx-accent)" }} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Configuration · v2.0"
        title="Pricing engine"
        description="Recalibrated to 2025 national averages. Manually tune every rate, activate a version to drive all preliminary bids, or scrape live local market pricing by ZIP code."
        actions={
          <button className="vx-btn primary" onClick={() => setDraft({ version: `v${(rules.length || 0) + 1}.0`, status: "draft", range_spread_pct: 0.15, ...(active ? { ...active, id: undefined } : {}) })}>
            <Plus size={16} /> New version
          </button>
        }
      />

      {/* National base-rate reference */}
      <section className="section">
        <div className="section-title-row">
          <h2 className="section-title">National base rates · 2025</h2>
          <span className="vx-kicker">Installed $/sqft · materials + labor</span>
        </div>
        <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
          {SYSTEM_OPTIONS.map((name, i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderBottom: i < SYSTEM_OPTIONS.length - 1 ? "1px solid var(--vx-border-soft)" : "none" }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 14, color: "var(--vx-text)" }}>{name}</strong>
                <p style={{ fontSize: 11, color: "var(--vx-faint)", margin: "2px 0 0" }}>{systemRates[name].low.toFixed(2)} – {systemRates[name].high.toFixed(2)} / sq ft</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--vx-accent)" }}>${systemRates[name].low.toFixed(0)} – ${systemRates[name].high.toFixed(0)}</span>
                <p style={{ fontSize: 10, color: "var(--vx-faint)", margin: "2px 0 0" }}>per sq ft</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "var(--vx-faint)", lineHeight: 1.5, margin: 0 }}>
          Sources: HomeAdvisor, Angi, Fixr, Homewyse, Craftsman Concrete Floors, Intermountain Coatings, and contractor pricing aggregators (2025).
        </p>
      </section>

      {/* ZIP code market scraper */}
      <section className="section">
        <div className="section-title-row">
          <h2 className="section-title"><MapPin size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />Local market intelligence</h2>
        </div>
        <div className="content-card">
          <p style={{ fontSize: 12, color: "var(--vx-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Enter a ZIP code and system to scrape live local contractor pricing from HomeAdvisor, Angi, Fixr, and regional aggregators. Results are saved for audit and reuse.
          </p>
          <div className="form-grid two" style={{ alignItems: "end" }}>
            <label className="field">ZIP code
              <input className="vx-input" type="text" maxLength={5} inputMode="numeric" placeholder="33101" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="field">Floor system
              <select className="vx-input" value={lookupSystem} onChange={(e) => setLookupSystem(e.target.value)}>
                {SYSTEM_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <button className="vx-btn primary" style={{ marginTop: 14 }} onClick={runLookup} disabled={looking}>
            {looking ? <Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} /> : <Search size={16} />}
            {looking ? "Scraping market…" : "Scrape local pricing"}
          </button>

          {lookupErr && <p style={{ fontSize: 12, color: "var(--vx-danger)", margin: "12px 0 0" }}>{lookupErr}</p>}

          {lookup && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <div className="home-pipeline" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="home-pipeline-card">
                  <strong>${(Number(lookup.low) || 0).toFixed(2)}</strong>
                  <span>Low / sqft</span>
                </div>
                <div className="home-pipeline-card">
                  <strong>${(Number(lookup.mid) || 0).toFixed(2)}</strong>
                  <span>Median / sqft</span>
                </div>
                <div className="home-pipeline-card">
                  <strong>${(Number(lookup.high) || 0).toFixed(2)}</strong>
                  <span>High / sqft</span>
                </div>
              </div>
              {lookup.summary && <p style={{ fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5, margin: 0 }}>{lookup.summary}</p>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11 }}>
                {lookup.metro_area && <span style={{ padding: "4px 10px", borderRadius: 8, background: "var(--vx-accent-soft)", color: "var(--vx-accent)", border: "1px solid var(--vx-accent)" }}>{lookup.metro_area}</span>}
                {lookup.confidence && <span style={{ padding: "4px 10px", borderRadius: 8, background: "var(--vx-panel-3)", color: "var(--vx-muted)" }}>Confidence: {lookup.confidence}</span>}
              </div>
              {lookup.sources && lookup.sources.length > 0 && (
                <div style={{ display: "grid", gap: 4 }}>
                  {lookup.sources.map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: "var(--vx-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Fixture preview */}
      {fixture && (
        <section className="section">
          <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span className="vx-kicker">Quote fixture · 500 sq ft, fair slab, grinding, 20 lf cracks, $5–10/sqft</span>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--vx-accent)", margin: "6px 0 0" }}>{money(fixture.low)} – {money(fixture.high)}</p>
            </div>
            <span style={{ fontSize: 11, color: "var(--vx-faint)" }}>Active rules {fixture.version}</span>
          </div>
        </section>
      )}

      {/* Manual rate editor */}
      {draft && (
        <section className="section">
          <div className="content-card form-grid">
            <div className="section-title-row">
              <h2 className="section-title">{draft.id ? "Edit version" : "New version"} · {draft.version}</h2>
            </div>
            <label className="field">Version label
              <input className="vx-input" value={draft.version || ""} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
            </label>
            <div className="form-grid two">
              {RATE_FIELDS.map(([k, label, type]) => (
                <label key={k} className="field">{label}
                  <input className="vx-input" type={type} step="0.01" value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <label className="field">Notes
              <input className="vx-input" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </label>
            <div className="viz-toggle-row">
              <button className="vx-btn primary" disabled={!draft.version || saving} onClick={save}>
                {saving ? <Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} /> : <Check size={16} />} Save version
              </button>
              <button className="vx-btn" onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Version history */}
      <section className="section">
        <div className="section-title-row">
          <h2 className="section-title"><TrendingUp size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />Version history</h2>
        </div>
        {!rules.length ? (
          <EmptyState icon={Calculator} title="No pricing versions yet" hint="Create a version and activate it to power the preliminary range." />
        ) : (
          <div className="section">
            {rules.map((r) => (
              <div key={r.id} className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 14, color: "var(--vx-text)" }}>{r.version}</strong>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 6,
                      background: r.status === "active" ? "var(--vx-accent-soft)" : "var(--vx-panel-3)",
                      color: r.status === "active" ? "var(--vx-accent)" : "var(--vx-muted)",
                      border: r.status === "active" ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)" }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--vx-faint)", margin: "6px 0 0" }}>
                    Mobilization ${r.mobilization_fee} · min ${r.min_job_price} · grinding ${r.prep_grinding_rate}/sqft · cracks ${r.crack_repair_rate}/lf · spread {Math.round((r.range_spread_pct || 0) * 100)}%
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="vx-btn outline-accent" onClick={() => setDraft(r)}>Edit</button>
                  {r.status !== "active" && (
                    <button className="vx-btn primary" onClick={() => activate(r)}>Activate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}