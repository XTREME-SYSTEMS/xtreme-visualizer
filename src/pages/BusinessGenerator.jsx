import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import GeneratorSection from "@/components/biz/GeneratorSection";
import { Loader2, Search, Check, Globe, Film } from "lucide-react";

const VIBES = ["Modern", "Premium / Luxury", "Rugged / Industrial", "Friendly / Approachable", "Bold / Energetic", "Minimalist"];
const NAME_STYLES = ["Descriptive", "Invented / Brandable", "Founder-based", "Acronym", "Compound"];

const obj = (props, required = []) => ({ type: "object", properties: props, required });

async function llm(prompt, schema) {
  const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  return res;
}
async function llmOptions(prompt, schema, key = "options") {
  const res = await llm(prompt, schema);
  return res?.[key] || [];
}
async function genImages(prompts) {
  return Promise.all(prompts.map((p) => base44.integrations.Core.GenerateImage({ prompt: p }).then((r) => ({ url: r.url, prompt: p }))));
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}
function isTaken(name, existing) {
  const b = normalize(name);
  if (!b) return false;
  return existing.some((n) => {
    const a = normalize(n);
    if (!a) return false;
    return a.includes(b) || b.includes(a);
  });
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--vx-muted)", fontWeight: 700 }}>
      {label}
      {children}
      {hint && <span style={{ color: "var(--vx-faint)", fontWeight: 400 }}>{hint}</span>}
    </label>
  );
}

const inputCls = "vx-input";
const selCls = "vx-input";

export default function BusinessGenerator() {
  const [onboarding, setOnboarding] = useState({ city: "", state: "", industry: "", specialties: "", vibe: VIBES[0], targetCustomer: "", nameStyle: NAME_STYLES[1], notes: "" });
  const [names, setNames] = useState([]);
  const [namesLoading, setNamesLoading] = useState(false);
  const [namesError, setNamesError] = useState("");
  const [competitors, setCompetitors] = useState([]);
  const [validating, setValidating] = useState(false);
  const [savedName, setSavedName] = useState(null);
  const [savedLogo, setSavedLogo] = useState(null);
  const [savedBrand, setSavedBrand] = useState(null);
  const [savedProposal, setSavedProposal] = useState(null);
  const [savedEmail, setSavedEmail] = useState(null);
  const [savedWebsite, setSavedWebsite] = useState(null);
  const [savedCard, setSavedCard] = useState(null);
  const [savedApp, setSavedApp] = useState(null);
  const [savedSocial, setSavedSocial] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const set = (k) => (e) => setOnboarding((o) => ({ ...o, [k]: e.target.value }));
  const onboardingReady = onboarding.city.trim() && onboarding.industry.trim() && onboarding.specialties.trim();

  const ctx = () => `Business name: ${savedName || "(not chosen yet)"}
Industry: ${onboarding.industry}
Location: ${onboarding.city}, ${onboarding.state}
Specialties: ${onboarding.specialties}
Brand vibe: ${onboarding.vibe}
Target customer: ${onboarding.targetCustomer || "(general)"}
Naming style preference: ${onboarding.nameStyle}
Extra notes: ${onboarding.notes || "none"}`;

  // Step 2: generate 10 names + scraper validation
  const generateNames = async () => {
    setNamesLoading(true);
    setNamesError("");
    setNames([]);
    setCompetitors([]);
    setSavedName(null);
    try {
      const prompt = `Generate 10 unique, brandable business names for a new company. Context:
${ctx()}

Rules:
- Names must fit the "${onboarding.vibe}" vibe and the "${onboarding.nameStyle}" naming style.
- Avoid obvious existing major brands and trademarks.
- Make them memorable, easy to spell, and relevant to the industry and specialties.
- Return exactly 10 names, each with a one-line rationale and a short tagline.`;
      const schema = obj({
        names: { type: "array", items: obj({ name: { type: "string" }, rationale: { type: "string" }, tagline: { type: "string" } }, ["name"]) },
      }, ["names"]);
      const list = await llmOptions(prompt, schema, "names");

      // Scraper validation — one scrape for the industry+location, then match
      setValidating(true);
      let existing = [];
      try {
        const res = await base44.functions.invoke("browserbaseScrape", { category: onboarding.industry, city: onboarding.city, state: onboarding.state, depth: "mid" });
        existing = (res?.results || []).map((r) => r.business_name).filter(Boolean);
        setCompetitors(existing);
      } catch (e) {
        // scraper optional — treat as no data
      }
      setValidating(false);

      const validated = list.map((n) => ({ ...n, taken: isTaken(n.name, existing) }));
      setNames(validated);
    } catch (e) {
      setNamesError(e?.message || "Name generation failed");
    } finally {
      setNamesLoading(false);
    }
  };

  // Step 3: logo (3 images)
  const generateLogos = async () => {
    const styles = ["minimalist wordmark, clean typography", "emblem with a custom icon mark", "abstract geometric symbol with the name"];
    const prompts = styles.map((s) => `Professional logo design for a business named "${savedName}", in the ${onboarding.industry} industry, ${onboarding.vibe} style. ${s}. Flat, modern, high contrast, centered on a dark background.`);
    return genImages(prompts);
  };

  // Step 4: brand package (3)
  const generateBrand = async () => {
    const prompt = `Design 3 distinct brand package options for this business. For each option provide: a confirmed brand name, a 3-color palette (each with name + hex), a heading font name, a body font name, a tagline, a voice/tone description, and a key differentiator.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({
          name: { type: "string" },
          colors: { type: "array", items: obj({ name: { type: "string" }, hex: { type: "string" } }) },
          heading_font: { type: "string" },
          body_font: { type: "string" },
          tagline: { type: "string" },
          voice: { type: "string" },
          differentiator: { type: "string" },
        }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  // Step 5: proposal templates (3)
  const generateProposals = async () => {
    const prompt = `Create 3 distinct proposal templates for selling this business's services to a prospective customer. Each template: a title, an angle (e.g. Good/Better/Best or Premium/Standard/Essentials), and 3-4 sections each with a heading and body copy. Make it persuasive and ready to customize.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({
          title: { type: "string" },
          angle: { type: "string" },
          sections: { type: "array", items: obj({ heading: { type: "string" }, body: { type: "string" } }) },
        }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  // Step 6: email templates (3)
  const generateEmails = async () => {
    const prompt = `Write 3 distinct cold outreach email templates for this business to prospective customers. Each with a subject line and a body. Vary the angle (e.g. problem-led, value-led, social-proof). Keep concise and professional.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({ subject: { type: "string" }, body: { type: "string" } }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  // Step 7: website/PWA (3)
  const generateWebsites = async () => {
    const prompt = `Design 3 distinct homepage concepts for a PWA website for this business. Each: a hero headline, a hero subheadline, 3-4 sections (each with a title and copy), and a primary CTA label. Optimize for mobile-first.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({
          hero_headline: { type: "string" },
          hero_sub: { type: "string" },
          cta: { type: "string" },
          sections: { type: "array", items: obj({ title: { type: "string" }, copy: { type: "string" } }) },
        }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  // Step 8: digital card + brochure (3 images)
  const generateCards = async () => {
    const styles = ["front-cover brochure, bold headline + hero imagery", "tri-fold brochure layout, services + contact", "digital business card, minimalist contact + QR style"];
    const prompts = styles.map((s) => `Marketing brochure design for "${savedName}", ${onboarding.industry} industry, ${onboarding.vibe} style. ${s}. Professional, print-ready, dark premium aesthetic with the business name visible.`);
    return genImages(prompts);
  };

  // Step 9: app concept (3)
  const generateApps = async () => {
    const prompt = `Conceptualize 3 distinct mobile app ideas for this business to serve its customers. Each: an app name, a list of 4-6 core features, a list of 3-5 primary screens, and a one-line value proposition.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({
          app_name: { type: "string" },
          value_prop: { type: "string" },
          core_features: { type: "array", items: { type: "string" } },
          primary_screens: { type: "array", items: { type: "string" } },
        }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  // Step 10: social content + video (3)
  const generateSocial = async () => {
    const prompt = `Create 3 distinct social media post concepts for this business. Each: a caption (with emojis), 5-8 hashtags, and a 4-second short-form video script (describe the visual scene). Tailor to ${onboarding.vibe} tone.

Context:
${ctx()}`;
    const schema = obj({
      options: {
        type: "array",
        items: obj({ caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } }, video_script: { type: "string" } }),
      },
    }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const renderVideo = async () => {
    if (!savedSocial) return;
    setVideoLoading(true);
    setVideoUrl(null);
    try {
      const prompt = `A 4-second vertical promotional video for a business named "${savedName}" in the ${onboarding.industry} industry. Scene: ${savedSocial.video_script}. ${onboarding.vibe} mood, cinematic, high quality, branded.`;
      const r = await base44.integrations.Core.GenerateVideo({ prompt, duration: 4, aspect_ratio: "9:16", generate_audio: false });
      setVideoUrl(r.url);
    } catch (e) {
      setVideoUrl(null);
    } finally {
      setVideoLoading(false);
    }
  };

  const steps = [
    { key: "onboard", label: "Onboarding", done: !!onboardingReady },
    { key: "names", label: "Business Names", done: !!savedName },
    { key: "logo", label: "Logo", done: !!savedLogo },
    { key: "brand", label: "Brand Package", done: !!savedBrand },
    { key: "proposal", label: "Proposal", done: !!savedProposal },
    { key: "email", label: "Emails", done: !!savedEmail },
    { key: "web", label: "Website / PWA", done: !!savedWebsite },
    { key: "card", label: "Card & Brochure", done: !!savedCard },
    { key: "app", label: "App Concept", done: !!savedApp },
    { key: "social", label: "Social & Video", done: !!savedSocial },
  ];

  return (
    <div style={{ display: "grid", gap: 16, padding: "16px 0 32px" }}>
      {/* Header */}
      <div>
        <span className="vx-kicker">AI BUSINESS BUILDER</span>
        <h1 style={{ margin: "4px 0 0", fontSize: 28, letterSpacing: "-.03em" }}>Business Generator</h1>
        <p style={{ margin: "6px 0 0", color: "var(--vx-muted)", fontSize: 14, lineHeight: 1.45 }}>
          Answer a few questions, generate 10 validated business names, then build your entire brand — logo, proposal, emails, website, app, and social video — 3 options at a time.
        </p>
      </div>

      {/* Stepper */}
      <div className="vx-card-soft" style={{ padding: 12, display: "flex", gap: 6, overflowX: "auto" }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, background: s.done ? "var(--vx-accent)" : "var(--vx-panel-3)", color: s.done ? "#0A0A0A" : "var(--vx-faint)" }}>
              {s.done ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
            </span>
            <span style={{ fontSize: 12, color: s.done ? "var(--vx-text)" : "var(--vx-faint)", whiteSpace: "nowrap" }}>{s.label}</span>
            {i < steps.length - 1 && <span style={{ color: "var(--vx-border)", margin: "0 2px" }}>·</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Onboarding */}
      <section className="vx-card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <div>
          <span className="vx-kicker">ONBOARDING</span>
          <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>1. Tell us about the business</h2>
          <p style={{ margin: "6px 0 0", color: "var(--vx-muted)", fontSize: 13 }}>The more detail you give, the better the AI can tailor every name and asset.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="City"><input className={inputCls} value={onboarding.city} onChange={set("city")} placeholder="e.g. Austin" /></Field>
          <Field label="State"><input className={inputCls} value={onboarding.state} onChange={set("state")} placeholder="e.g. TX" /></Field>
        </div>
        <Field label="Industry"><input className={inputCls} value={onboarding.industry} onChange={set("industry")} placeholder="e.g. Epoxy floor coatings" /></Field>
        <Field label="Specialties" hint="Comma-separated services or differentiators"><input className={inputCls} value={onboarding.specialties} onChange={set("specialties")} placeholder="e.g. garage floors, commercial polished concrete" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Brand vibe">
            <select className={selCls} value={onboarding.vibe} onChange={set("vibe")}>{VIBES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          </Field>
          <Field label="Name style">
            <select className={selCls} value={onboarding.nameStyle} onChange={set("nameStyle")}>{NAME_STYLES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          </Field>
        </div>
        <Field label="Target customer" hint="Who you serve most"><input className={inputCls} value={onboarding.targetCustomer} onChange={set("targetCustomer")} placeholder="e.g. homeowners, property managers" /></Field>
        <Field label="Anything else?"><textarea className={inputCls} rows={2} value={onboarding.notes} onChange={set("notes")} placeholder="Keywords to include, names to avoid, founders' initials, etc." /></Field>
      </section>

      {/* Step 2: Names + validation */}
      <section className="vx-card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <div>
          <span className="vx-kicker">NAMING</span>
          <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>2. Generate 10 business names</h2>
          <p style={{ margin: "6px 0 0", color: "var(--vx-muted)", fontSize: 13 }}>Each name is checked against the scraper to see if it's already in use in your area.</p>
        </div>
        <button className="vx-btn primary" onClick={generateNames} disabled={!onboardingReady || namesLoading} style={{ alignSelf: "flex-start" }}>
          {namesLoading ? <Loader2 className="vx-icon" /> : <Search className="vx-icon" />}
          {namesLoading ? (validating ? "Validating with scraper…" : "Generating…") : "Generate & validate 10 names"}
        </button>
        {!onboardingReady && <p style={{ color: "var(--vx-faint)", fontSize: 12, margin: 0 }}>Fill city, industry, and specialties first.</p>}
        {namesError && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{namesError}</p>}

        {names.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {names.map((n, i) => {
              const active = savedName === n.name;
              return (
                <div key={i} onClick={() => setSavedName(n.name)} style={{ cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: 14, borderRadius: 14, border: active ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)", background: active ? "var(--vx-accent-soft)" : "var(--vx-panel)", boxShadow: active ? "var(--vx-glow)" : "none" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <strong style={{ fontSize: 16 }}>{n.name}</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 8, border: n.taken ? "1px solid #7f1a20" : "1px solid #8A7300", color: n.taken ? "#ff858b" : "var(--vx-accent)", background: n.taken ? "rgba(255,82,88,.08)" : "rgba(255,214,10,.06)" }}>
                        {n.taken ? "Possibly taken" : "Likely available"}
                      </span>
                    </div>
                    {n.rationale && <p style={{ margin: "4px 0 0", color: "var(--vx-muted)", fontSize: 12 }}>{n.rationale}</p>}
                    {n.tagline && <p style={{ margin: "2px 0 0", color: "var(--vx-accent)", fontSize: 12, fontStyle: "italic" }}>“{n.tagline}”</p>}
                  </div>
                  {active && <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center", alignSelf: "start" }}><Check style={{ width: 13, height: 13 }} /></span>}
                </div>
              );
            })}
          </div>
        )}

        {savedName && (
          <div className="vx-notice" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Check className="vx-icon" /> Approved name: <strong style={{ color: "var(--vx-accent)" }}>{savedName}</strong>
          </div>
        )}

        {competitors.length > 0 && (
          <div className="vx-card-soft" style={{ padding: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", display: "flex", alignItems: "center", gap: 6 }}><Globe className="vx-icon-sm" /> Competitors already operating in {onboarding.city}:</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--vx-faint)" }}>{competitors.slice(0, 12).join(" · ")}</p>
          </div>
        )}
      </section>

      {/* Step 3: Logo */}
      <GeneratorSection index={3} tag="IDENTITY" title="Logo generator" description="3 distinct logo concepts based on your approved name." canGenerate={!!savedName} lockedMessage="Save a business name first." generate={generateLogos} selectedKey={savedLogo?._i} onSelect={(opt, i, save) => { setSavedLogo({ ...opt, _i: i }); if (save) setSavedLogo({ ...opt, _i: i }); }} renderOption={(opt) => (
        <div style={{ aspectRatio: "16/10", background: "#0b0b0b" }}>
          <img src={opt.url} alt="logo option" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )} />

      {/* Step 4: Brand package */}
      <GeneratorSection index={4} tag="BRAND" title="Brand package generator" description="3 full brand systems — palette, fonts, tagline, voice, differentiator." canGenerate={!!savedName} lockedMessage="Save a business name first." generate={generateBrand} selectedKey={savedBrand?._i} onSelect={(opt, i, save) => setSavedBrand({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <strong style={{ fontSize: 15 }}>{opt.name}</strong>
          <div style={{ display: "flex", gap: 6 }}>
            {(opt.colors || []).map((c, j) => <div key={j} title={`${c.name} ${c.hex}`} style={{ flex: 1, height: 32, borderRadius: 8, background: c.hex, border: "1px solid var(--vx-border-soft)" }} />)}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}>Fonts: <span style={{ color: "var(--vx-text)" }}>{opt.heading_font}</span> / <span style={{ color: "var(--vx-text)" }}>{opt.body_font}</span></p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-accent)" }}>“{opt.tagline}”</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><strong style={{ color: "var(--vx-text)" }}>Voice:</strong> {opt.voice}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><strong style={{ color: "var(--vx-text)" }}>Differentiator:</strong> {opt.differentiator}</p>
        </div>
      )} />

      {/* Step 5: Proposal */}
      <GeneratorSection index={5} tag="SALES" title="Proposal generator" description="3 proposal templates to pitch your services." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateProposals} selectedKey={savedProposal?._i} onSelect={(opt, i) => setSavedProposal({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <strong style={{ fontSize: 15 }}>{opt.title}</strong>
          <span style={{ fontSize: 11, color: "var(--vx-accent)", textTransform: "uppercase", letterSpacing: ".04em" }}>{opt.angle}</span>
          {(opt.sections || []).map((s, j) => (
            <div key={j}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--vx-text)" }}>{s.heading}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.45 }}>{s.body}</p>
            </div>
          ))}
        </div>
      )} />

      {/* Step 6: Emails */}
      <GeneratorSection index={6} tag="OUTREACH" title="Email template generator" description="3 cold outreach email drafts." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateEmails} selectedKey={savedEmail?._i} onSelect={(opt, i) => setSavedEmail({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 13, color: "var(--vx-accent)" }}>{opt.subject}</strong>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{opt.body}</p>
        </div>
      )} />

      {/* Step 7: Website / PWA */}
      <GeneratorSection index={7} tag="WEB" title="Desktop / PWA website generator" description="3 homepage concepts, mobile-first." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateWebsites} selectedKey={savedWebsite?._i} onSelect={(opt, i) => setSavedWebsite({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <strong style={{ fontSize: 17 }}>{opt.hero_headline}</strong>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}>{opt.hero_sub}</p>
          <span style={{ fontSize: 11, color: "var(--vx-accent)" }}>CTA: {opt.cta}</span>
          {(opt.sections || []).map((s, j) => (
            <div key={j}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--vx-text)" }}>{s.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.45 }}>{s.copy}</p>
            </div>
          ))}
        </div>
      )} />

      {/* Step 8: Digital card + brochure */}
      <GeneratorSection index={8} tag="PRINT" title="Digital business card & brochure generator" description="3 brochure/card designs." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateCards} selectedKey={savedCard?._i} onSelect={(opt, i) => setSavedCard({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ aspectRatio: "3/4", background: "#0b0b0b" }}>
          <img src={opt.url} alt="brochure option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )} />

      {/* Step 9: App concept */}
      <GeneratorSection index={9} tag="PRODUCT" title="App generator" description="3 mobile app concepts for your customers." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateApps} selectedKey={savedApp?._i} onSelect={(opt, i) => setSavedApp({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 15 }}>{opt.app_name}</strong>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-accent)" }}>{opt.value_prop}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><strong style={{ color: "var(--vx-text)" }}>Features:</strong> {(opt.core_features || []).join(", ")}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><strong style={{ color: "var(--vx-text)" }}>Screens:</strong> {(opt.primary_screens || []).join(", ")}</p>
        </div>
      )} />

      {/* Step 10: Social + video */}
      <GeneratorSection index={10} tag="CONTENT" title="Social media content & video generator" description="3 social post concepts; render a 4s video from your pick." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateSocial} selectedKey={savedSocial?._i} onSelect={(opt, i) => { setSavedSocial({ ...opt, _i: i }); setVideoUrl(null); }} renderOption={(opt) => (
        <div style={{ padding: 14, display: "grid", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--vx-text)", whiteSpace: "pre-wrap" }}>{opt.caption}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-accent)" }}>{(opt.hashtags || []).join(" ")}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><strong style={{ color: "var(--vx-text)" }}>Video script:</strong> {opt.video_script}</p>
        </div>
      )} />

      {savedSocial && (
        <section className="vx-card" style={{ padding: 18, display: "grid", gap: 12 }}>
          <div>
            <span className="vx-kicker">VIDEO</span>
            <h2 style={{ margin: "4px 0 0", fontSize: 18 }}>Render your social video</h2>
            <p style={{ margin: "6px 0 0", color: "var(--vx-muted)", fontSize: 13 }}>Generates a 4-second vertical clip from your selected post concept.</p>
          </div>
          <button className="vx-btn primary" onClick={renderVideo} disabled={videoLoading} style={{ alignSelf: "flex-start" }}>
            {videoLoading ? <Loader2 className="vx-icon" /> : <Film className="vx-icon" />}
            {videoLoading ? "Rendering video…" : "Render 4s video"}
          </button>
          {videoUrl && (
            <video src={videoUrl} controls playsInline style={{ width: "100%", maxWidth: 300, borderRadius: 14, border: "1px solid var(--vx-border-soft)", margin: "0 auto" }} />
          )}
        </section>
      )}
    </div>
  );
}