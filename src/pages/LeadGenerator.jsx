import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Search,
  Loader2,
  Mail,
  Sparkles,
  Users,
  Check,
  Globe,
  Phone,
  MapPin,
  Send,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const DEPTHS = [
  { value: "quick", label: "Quick", desc: "6 sites" },
  { value: "mid", label: "Mid", desc: "10 sites" },
  { value: "deep", label: "Deep", desc: "8 + contact" },
];

export default function LeadGenerator() {
  const [form, setForm] = useState({ category: "", city: "", state: "", depth: "mid" });
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());

  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResults, setSentResults] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(0);

  useEffect(() => {
    base44.auth.me().then((u) => setCompanyName(u?.company_name || "")).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const scrape = async () => {
    if (!form.category) return;
    setScraping(true);
    setError("");
    setResults(null);
    setSelected(new Set());
    setSentResults(null);
    setEmailOpen(false);
    try {
      const res = await base44.functions.invoke("browserbaseScrape", form);
      if (res.data?.error) setError(res.data.error + (res.data.detail ? ` — ${res.data.detail}` : ""));
      else setResults(res.data?.results || []);
    } catch (e) {
      setError(e?.message || "Scrape failed. Make sure your Browserbase keys are set.");
    } finally {
      setScraping(false);
    }
  };

  const allSelected = results && results.length > 0 && selected.size === results.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(results.map((_, i) => i)));
  const toggle = (i) => {
    const n = new Set(selected);
    n.has(i) ? n.delete(i) : n.add(i);
    setSelected(n);
  };
  const selectedLeads = [...selected].map((i) => results[i]).filter(Boolean);
  const emailable = selectedLeads.filter((r) => r.email);

  const enhance = async () => {
    setEnhancing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a professional cold outreach email for a commercial flooring/coatings contractor named "${companyName || "our company"}" reaching out to local businesses in the "${form.category}" space. Make it friendly, concise, value-driven, and end with a clear call to action to schedule a free on-site estimate. Return JSON {subject, body}.`,
        response_json_schema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } } },
      });
      setSubject(res.subject || "");
      setBody(res.body || "");
    } catch {
    } finally {
      setEnhancing(false);
    }
  };

  const sendEmails = async () => {
    if (emailable.length === 0 || !subject) return;
    setSending(true);
    setSentResults(null);
    try {
      const res = await base44.functions.invoke("sendScrapeEmails", {
        leads: emailable,
        subject,
        body,
        company_name: companyName,
        use_ai: true,
      });
      if (res.data?.error) setError(res.data.error);
      else setSentResults(res.data?.results || []);
    } catch (e) {
      setError(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const convertToCRM = async () => {
    const toCreate = (sentResults ? sentResults.filter((s) => s.sent).map((s) => s.lead) : emailable).map((r) => ({
      customer_name: r.business_name,
      email: r.email,
      phone: r.phone,
      project_address: [r.address, form.city, form.state].filter(Boolean).join(", "),
      source: "lead_generator",
      status: "new",
      notes: `Scraped: ${form.category}${r.website ? ` · ${r.website}` : ""}`,
    }));
    if (toCreate.length === 0) return;
    setConverting(true);
    try {
      await base44.entities.Lead.bulkCreate(toCreate);
      setConverted(toCreate.length);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>
            Lead <span style={{ color: "var(--vx-accent)" }}>Scraper</span>
          </h1>
          <p>Find local businesses by category and location. Scrape contact info, email them, and push to your CRM.</p>
        </div>
      </div>

      {/* Search form */}
      <div className="hx-scraper-form">
        <div className="hx-scraper-search">
          <Search size={18} />
          <input
            placeholder="What are you scraping? e.g. Garage Epoxy Contractors"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && scrape()}
          />
        </div>
        <div className="hx-scraper-row">
          <input className="hx-scraper-input" placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <input className="hx-scraper-input" placeholder="State" value={form.state} onChange={(e) => set("state", e.target.value)} />
        </div>
        <div className="hx-depth-row">
          {DEPTHS.map((d) => (
            <button key={d.value} className={"hx-depth" + (form.depth === d.value ? " active" : "")} onClick={() => set("depth", d.value)}>
              <strong>{d.label}</strong>
              <small>{d.desc}</small>
            </button>
          ))}
        </div>
        <button className="hx-mini-btn" style={{ width: "100%" }} disabled={!form.category || scraping} onClick={scrape}>
          {scraping ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          <span>{scraping ? "Scraping…" : "Start Scrape"}</span>
        </button>
      </div>

      {error && (
        <div className="hx-notice" style={{ borderColor: "var(--vx-danger)", color: "var(--vx-danger)", background: "rgba(255,82,88,.08)" }}>
          <AlertCircle size={14} style={{ display: "inline", marginRight: 6 }} />
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          <div className="hx-section-head">
            <h2>
              {results.length} result{results.length !== 1 ? "s" : ""} · {selected.size} selected
            </h2>
            <button onClick={toggleAll} style={{ background: "transparent", border: 0, color: "var(--vx-accent)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="hx-scraper-results">
            {results.length === 0 ? (
              <div className="hx-empty">No results found. Try a different category or location.</div>
            ) : (
              results.map((r, i) => (
                <div key={i} className={"hx-scraper-result" + (selected.has(i) ? " selected" : "")} onClick={() => toggle(i)}>
                  <div className="hx-scraper-check">{selected.has(i) ? <Check size={18} /> : <span style={{ width: 18, height: 18, border: "1.5px solid #4a4a4a", borderRadius: 5, display: "block" }} />}</div>
                  <div className="hx-scraper-info">
                    <strong>{r.business_name || "Unknown"}</strong>
                    <div className="hx-scraper-meta">
                      {r.email ? <span><Mail size={12} /> {r.email}</span> : <span className="hx-scraper-noemail">No email found</span>}
                      {r.phone && <span><Phone size={12} /> {r.phone}</span>}
                      {r.address && <span><MapPin size={12} /> {r.address}</span>}
                      {r.website && <span><Globe size={12} /> <a href={r.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>site</a></span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action bar */}
          {selected.size > 0 && (
            <div className="hx-scraper-actionbar">
              <button className="hx-mini-btn" onClick={() => setEmailOpen((v) => !v)}>
                <Mail size={16} /> <span>{emailOpen ? "Hide email" : "Email selected"}</span>
              </button>
              {emailable.length > 0 && (
                <button className="hx-mini-btn dark" disabled={converting} onClick={convertToCRM}>
                  <Users size={16} /> <span>{converting ? "Converting…" : "Convert to CRM"}</span>
                </button>
              )}
            </div>
          )}

          {/* Email template panel */}
          {emailOpen && (
            <div className="hx-bid-input-card" style={{ background: "#1A1A1A" }}>
              <div className="hx-bid-input-label">
                <Sparkles size={15} />
                <span>Email template — personalized per lead with AI</span>
              </div>
              <input className="hx-scraper-input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea className="hx-bid-textarea" placeholder="Email body…" value={body} onChange={(e) => setBody(e.target.value)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="hx-mini-btn dark" disabled={enhancing} onClick={enhance}>
                  {enhancing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} <span>AI Enhance</span>
                </button>
                <button className="hx-mini-btn" disabled={!subject || sending || emailable.length === 0} onClick={sendEmails}>
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} <span>Send to {emailable.length}</span>
                </button>
              </div>

              {sentResults && (
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--vx-accent)", fontWeight: 700 }}>
                    Sent {sentResults.filter((s) => s.sent).length} / {sentResults.length}
                  </div>
                  {sentResults.filter((s) => s.sent).length > 0 && (
                    <button className="hx-mini-btn" disabled={converting} onClick={convertToCRM}>
                      <ArrowRight size={16} /> <span>{converting ? "Converting…" : `Push ${sentResults.filter((s) => s.sent).length} emailed leads to CRM`}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {converted > 0 && (
            <div className="hx-notice" style={{ borderColor: "var(--vx-accent)", color: "var(--vx-accent)", background: "var(--vx-accent-soft)" }}>
              <Check size={14} style={{ display: "inline", marginRight: 6 }} />
              {converted} leads pushed to CRM. The automated follow-up sequence has started.
            </div>
          )}
        </>
      )}
    </div>
  );
}