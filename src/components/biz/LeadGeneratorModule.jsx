import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, Send, Check, MapPin, Users, RefreshCw, AlertCircle, Target, Clock, Search } from "lucide-react";

const obj = (props, required = []) => ({ type: "object", properties: props, required });

function SectionHead({ icon: Icon, tag, title, description }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", color: "var(--vx-accent)", border: "1px solid #8A7300", background: "var(--vx-accent-soft)", boxShadow: "var(--vx-glow)" }}>
        {Icon ? <Icon style={{ width: 22, height: 22 }} /> : null}
      </span>
      <div style={{ minWidth: 0 }}>
        <span className="vx-kicker">{tag}</span>
        <h2 style={{ margin: "3px 0 0", fontSize: 19, letterSpacing: "-.02em" }}>{title}</h2>
        {description && <p style={{ margin: "5px 0 0", color: "var(--vx-muted)", fontSize: 12.5, lineHeight: 1.45 }}>{description}</p>}
      </div>
    </div>
  );
}

export default function LeadGeneratorModule({ savedName, savedBrand, onboarding, onComplete }) {
  const [phase, setPhase] = useState(0); // 0=templates, 1=scraping, 2=review, 3=results
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [targetCategories, setTargetCategories] = useState([]);
  const [scrapeResults, setScrapeResults] = useState([]);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [deselected, setDeselected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendResults, setSendResults] = useState(null);
  const [crmLeads, setCrmLeads] = useState([]);
  const [followupPlan, setFollowupPlan] = useState(null);
  const [activeCity, setActiveCity] = useState(onboarding.city);
  const [activeState, setActiveState] = useState(onboarding.state);
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [territoryCount, setTerritoryCount] = useState(0);

  const brandCtx = () => {
    const colors = savedBrand?.colors?.map((c) => `${c.name} (${c.hex})`).join(", ") || "";
    return [
      `Business name: ${savedName}`,
      `Industry: ${onboarding.industry}`,
      `Location: ${onboarding.city}, ${onboarding.state}`,
      `Specialties: ${onboarding.specialties}`,
      `Brand vibe: ${onboarding.vibe}`,
      `Target customer: ${onboarding.targetCustomer || "general"}`,
      `Tagline: ${savedBrand?.tagline || ""}`,
      `Brand voice: ${savedBrand?.voice || ""}`,
      `Differentiator: ${savedBrand?.differentiator || ""}`,
      `Colors: ${colors}`,
    ].join("\n");
  };

  const generateTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const prompt = `Generate 10 distinct cold outreach email templates for this business. Each must use a different angle: (1) direct introduction, (2) value proposition, (3) social proof, (4) question-based, (5) free consultation, (6) industry insight, (7) limited-time offer, (8) compliment opener, (9) problem-solution, (10) partnership. Each template: a compelling subject line and a 2-3 paragraph body. Use the business name and brand voice. Sign with the business name. Keep professional and concise.\n\nContext:\n${brandCtx()}`;
      const schema = obj({ templates: { type: "array", items: obj({ angle: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }) } }, ["templates"]);
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      setTemplates(res?.templates || []);
    } catch (e) {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const scrapeTerritory = async (city, state) => {
    setScrapeLoading(true);
    setScrapeError("");
    setScrapeResults([]);
    setDeselected(new Set());
    setActiveCity(city);
    setActiveState(state);
    setPhase(1);
    try {
      const catPrompt = `A business in the "${onboarding.industry}" industry wants to find potential B2B customers in ${city}, ${state}. What types of local businesses or organizations would be the best potential customers? Return 3-5 specific, searchable business categories (e.g. "property management companies", "warehouse facilities", "auto repair shops"). Return as a JSON object with a "categories" array.`;
      const catRes = await base44.integrations.Core.InvokeLLM({
        prompt: catPrompt,
        response_json_schema: obj({ categories: { type: "array", items: { type: "string" } } }, ["categories"]),
      });
      const categories = catRes?.categories || [];
      setTargetCategories(categories);

      const allResults = [];
      for (const cat of categories) {
        try {
          const res = await base44.functions.invoke("browserbaseScrape", { category: cat, city, state, depth: "mid" });
          if (res?.results) {
            for (const r of res.results) allResults.push({ ...r, target_category: cat });
          }
        } catch {}
      }

      const seen = new Set();
      const deduped = allResults.filter((r) => {
        const key = (r.business_name || "").toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setScrapeResults(deduped);
      setPhase(2);
    } catch (e) {
      setScrapeError(e?.message || "Scraping failed");
      setPhase(2);
    } finally {
      setScrapeLoading(false);
    }
  };

  const toggleDeselect = (idx) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectedLeads = scrapeResults.filter((_, i) => !deselected.has(i));
  const emailableLeads = selectedLeads.filter((l) => l.email);

  const handleSend = async () => {
    setSending(true);
    setSendError("");
    try {
      const sendRes = await base44.functions.invoke("sendScrapeEmails", {
        leads: emailableLeads,
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        company_name: savedName,
        use_ai: true,
      });
      setSendResults(sendRes);

      const leads = await base44.entities.Lead.bulkCreate(
        emailableLeads.map((l) => ({
          customer_name: l.business_name,
          email: l.email,
          phone: l.phone,
          project_address: l.address,
          source: "lead_generator",
          status: "new",
          follow_up_stage: "welcome_sent",
          last_contacted_date: new Date().toISOString(),
          notes: `Auto-scraped from ${activeCity}, ${activeState} | Target: ${l.target_category} | Template: ${selectedTemplate.angle}`,
        }))
      );
      setCrmLeads(leads);

      const nextSend = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const plan = await base44.entities.FollowupPlan.create({
        name: `${savedName} — ${activeCity}, ${activeState} follow-up`,
        lead_ids: leads.map((l) => l.id),
        interval_days: 3,
        max_followups: 4,
        active: true,
        next_send_date: nextSend,
        subject_template: selectedTemplate.subject,
        body_template: selectedTemplate.body,
        use_ai: true,
      });
      setFollowupPlan(plan);

      setPhase(3);
      if (onComplete) onComplete(true);
    } catch (e) {
      setSendError(e?.message || "Send failed — is Gmail connected in Settings?");
    } finally {
      setSending(false);
    }
  };

  const handleExpand = async () => {
    if (!newCity.trim()) return;
    setTerritoryCount((c) => c + 1);
    setSendResults(null);
    setCrmLeads([]);
    setFollowupPlan(null);
    await scrapeTerritory(newCity.trim(), newState.trim() || onboarding.state);
    setNewCity("");
    setNewState("");
  };

  const optPad = { padding: 15, display: "grid", gap: 9 };
  const divider = { height: 1, background: "var(--vx-border-soft)", margin: "2px 0" };
  const subLabel = { fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--vx-faint)" };

  return (
    <section className="vx-card" style={{ padding: 20, display: "grid", gap: 16, borderColor: "#8A7300" }}>
      <SectionHead icon={Target} tag="LEAD ENGINE" title="Autonomous lead generator" description="Generate branded emails, scrape your territory for high-potential customers, send campaigns, log to CRM, and auto-follow-up — then expand to new territories." />

      {/* Phase 0: Generate templates */}
      {phase === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="vx-btn primary" onClick={generateTemplates} disabled={templatesLoading}>
            {templatesLoading ? <Loader2 className="vx-icon" /> : <Mail className="vx-icon" />}
            {templatesLoading ? "Generating 10 templates…" : "Generate 10 branded email templates"}
          </button>
          <span style={{ fontSize: 12, color: "var(--vx-faint)" }}>Uses your approved brand name, voice & tagline.</span>
        </div>
      )}

      {/* Template selection (phases 0-2) */}
      {templates.length > 0 && phase < 3 && (
        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--vx-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Select an email template</span>
          {templates.map((t, i) => {
            const active = selectedTemplate === t;
            return (
              <div key={i} onClick={() => setSelectedTemplate(t)} style={{ cursor: "pointer", ...optPad, borderRadius: 14, border: active ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)", background: active ? "linear-gradient(160deg, var(--vx-accent-soft), var(--vx-panel))" : "var(--vx-panel)", boxShadow: active ? "var(--vx-glow)" : "none", transition: "border-color .15s, box-shadow .15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{t.angle}</strong>
                  {active && <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center", marginLeft: "auto" }}><Check style={{ width: 13, height: 13 }} /></span>}
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--vx-accent)", fontWeight: 700 }}>{t.subject}</p>
                <div style={divider} />
                <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{t.body.slice(0, 160)}{t.body.length > 160 ? "…" : ""}</p>
              </div>
            );
          })}
          {selectedTemplate && phase === 0 && (
            <button className="vx-btn primary" onClick={() => scrapeTerritory(onboarding.city, onboarding.state)} style={{ alignSelf: "flex-start" }}>
              <Search className="vx-icon" /> Start scraping {onboarding.city}, {onboarding.state}
            </button>
          )}
        </div>
      )}

      {/* Phase 1: Scraping */}
      {phase === 1 && (
        <div style={{ display: "grid", gap: 10, padding: 20, borderRadius: 14, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel-2)", textAlign: "center" }}>
          <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: "var(--vx-accent)", margin: "0 auto" }} />
          <strong style={{ fontSize: 14 }}>Scraping {activeCity}, {activeState} for business opportunities…</strong>
          {targetCategories.length > 0 && <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}>Targeting: {targetCategories.join(" · ")}</p>}
        </div>
      )}

      {/* Phase 2: Review leads */}
      {phase === 2 && !scrapeLoading && (
        <>
          {scrapeError && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, border: "1px solid var(--vx-danger)", background: "rgba(255,82,88,.06)" }}><AlertCircle style={{ width: 16, height: 16, color: "var(--vx-danger)" }} /><span style={{ fontSize: 12, color: "var(--vx-danger)" }}>{scrapeError}</span></div>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--vx-muted)" }}><Users className="vx-icon-sm" /> {scrapeResults.length} businesses found</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--vx-accent)" }}><Mail className="vx-icon-sm" /> {emailableLeads.length} with emails (emailable)</span>
          </div>
          {scrapeResults.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--vx-faint)" }}>No businesses found. Try a different territory or industry.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {scrapeResults.map((lead, i) => {
                const checked = !deselected.has(i);
                return (
                  <div key={i} style={{ display: "flex", gap: 12, padding: 13, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)", alignItems: "flex-start" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", paddingTop: 2 }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleDeselect(i)} style={{ width: 18, height: 18, accentColor: "var(--vx-accent)" }} />
                    </label>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 13.5 }}>{lead.business_name}</strong>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, border: "1px solid var(--vx-border-soft)", color: "var(--vx-faint)" }}>{lead.target_category}</span>
                        {!lead.email && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, border: "1px solid #7f1a20", color: "#ff858b", background: "rgba(255,82,88,.06)" }}>No email</span>}
                      </div>
                      {lead.email && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--vx-accent)" }}>{lead.email}</p>}
                      {lead.address && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--vx-faint)" }}>{lead.address}</p>}
                      {lead.phone && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--vx-faint)" }}>{lead.phone}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {scrapeResults.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button className="vx-btn primary" onClick={handleSend} disabled={!selectedTemplate || sending || emailableLeads.length === 0}>
                {sending ? <Loader2 className="vx-icon" /> : <Send className="vx-icon" />}
                {sending ? "Sending & logging…" : `Approve & send to ${emailableLeads.length} businesses`}
              </button>
              {!selectedTemplate && <span style={{ fontSize: 12, color: "var(--vx-faint)" }}>Select an email template above first.</span>}
            </div>
          )}
          {sendError && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, border: "1px solid var(--vx-danger)", background: "rgba(255,82,88,.06)" }}><AlertCircle style={{ width: 16, height: 16, color: "var(--vx-danger)" }} /><span style={{ fontSize: 12, color: "var(--vx-danger)" }}>{sendError}</span></div>}
        </>
      )}

      {/* Phase 3: Results & expand */}
      {phase === 3 && (
        <>
          <div style={{ display: "grid", gap: 10, padding: 18, borderRadius: 14, border: "1px solid var(--vx-accent)", background: "linear-gradient(135deg, rgba(255,214,10,.10), var(--vx-panel))", boxShadow: "var(--vx-glow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center" }}><Check style={{ width: 17, height: 17 }} /></span>
              <strong style={{ fontSize: 15 }}>Campaign complete for {activeCity}, {activeState}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)" }}>
                <strong style={{ fontSize: 22, color: "var(--vx-accent)" }}>{sendResults?.sent || 0}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--vx-faint)" }}>Emails sent</p>
              </div>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)" }}>
                <strong style={{ fontSize: 22, color: "var(--vx-accent)" }}>{crmLeads.length}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--vx-faint)" }}>Logged in CRM</p>
              </div>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)" }}>
                <strong style={{ fontSize: 22, color: "var(--vx-accent)" }}>3 days</strong>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--vx-faint)" }}>Follow-up in</p>
              </div>
            </div>
          </div>

          {followupPlan && (
            <div style={{ ...optPad, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel-2)" }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--vx-muted)" }}><span style={subLabel}>Follow-up plan </span><strong style={{ color: "var(--vx-text)" }}>{followupPlan.name}</strong></p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--vx-faint)" }}><Clock className="vx-icon-sm" /> Auto-follows up every {followupPlan.interval_days} days, up to {followupPlan.max_followups} times. Next send: {new Date(followupPlan.next_send_date).toLocaleDateString()}</p>
            </div>
          )}

          {/* Expand to new territory */}
          <div style={{ ...optPad, borderRadius: 14, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin style={{ width: 16, height: 16, color: "var(--vx-accent)" }} />
              <strong style={{ fontSize: 14 }}>Expand to a new territory</strong>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--vx-muted)" }}>Scrape a new city using the same brand & email template. {territoryCount > 0 && <span style={{ color: "var(--vx-accent)" }}>{territoryCount} territories completed so far.</span>}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 4 }}>
              <input className="vx-input" style={{ flex: 1 }} value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="New city" />
              <input className="vx-input" style={{ flex: 1 }} value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="State" />
              <button className="vx-btn primary" onClick={handleExpand} disabled={!newCity.trim() || scrapeLoading}>
                {scrapeLoading ? <Loader2 className="vx-icon" /> : <RefreshCw className="vx-icon" />}
                Scrape
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}