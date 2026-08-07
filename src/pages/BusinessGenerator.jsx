import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import GeneratorSection from "@/components/biz/GeneratorSection";
import AiFieldButton from "@/components/biz/AiFieldButton";
import { Loader2, Search, Check, Globe, Film, Wand2, ClipboardList, Palette, FileText, Mail, MonitorSmartphone, CreditCard, Smartphone, Share2, Image } from "lucide-react";

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
  const setVal = (k, v) => setOnboarding((o) => ({ ...o, [k]: v }));
  const onboardingReady = onboarding.city.trim() && onboarding.industry.trim() && onboarding.specialties.trim();

  const ctx = () => "Business name: " + (savedName || "(not chosen yet)") +
    "\nIndustry: " + onboarding.industry +
    "\nLocation: " + onboarding.city + ", " + onboarding.state +
    "\nSpecialties: " + onboarding.specialties +
    "\nBrand vibe: " + onboarding.vibe +
    "\nTarget customer: " + (onboarding.targetCustomer || "(general)") +
    "\nNaming style preference: " + onboarding.nameStyle +
    "\nExtra notes: " + (onboarding.notes || "none");

  const generateNames = async () => {
    setNamesLoading(true); setNamesError(""); setNames([]); setCompetitors([]); setSavedName(null);
    try {
      const prompt = "Generate 10 unique, brandable business names for a new company. Context:\n" + ctx() +
        "\n\nRules:\n- Names must fit the \"" + onboarding.vibe + "\" vibe and the \"" + onboarding.nameStyle + "\" naming style.\n- Avoid obvious existing major brands and trademarks.\n- Make them memorable, easy to spell, and relevant to the industry and specialties.\n- Return exactly 10 names, each with a one-line rationale and a short tagline.";
      const schema = obj({ names: { type: "array", items: obj({ name: { type: "string" }, rationale: { type: "string" }, tagline: { type: "string" } }, ["name"]) } }, ["names"]);
      const list = await llmOptions(prompt, schema, "names");

      setValidating(true);
      let existing = [];
      try {
        const res = await base44.functions.invoke("browserbaseScrape", { category: onboarding.industry, city: onboarding.city, state: onboarding.state, depth: "mid" });
        existing = (res?.results || []).map((r) => r.business_name).filter(Boolean);
        setCompetitors(existing);
      } catch (e) {}
      setValidating(false);

      setNames(list.map((n) => ({ ...n, taken: isTaken(n.name, existing) })));
    } catch (e) {
      setNamesError(e?.message || "Name generation failed");
    } finally {
      setNamesLoading(false);
    }
  };

  const generateLogos = async () => {
    const styles = ["minimalist wordmark, clean typography", "emblem with a custom icon mark", "abstract geometric symbol with the name"];
    const prompts = styles.map((s) => "Professional logo design for a business named \"" + savedName + "\", in the " + onboarding.industry + " industry, " + onboarding.vibe + " style. " + s + ". Flat, modern, high contrast, centered on a dark background.");
    return genImages(prompts);
  };

  const generateBrand = async () => {
    const prompt = "Design 3 distinct brand package options for this business. For each option provide: a confirmed brand name, a 3-color palette (each with name + hex), a heading font name, a body font name, a tagline, a voice/tone description, and a key differentiator.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ name: { type: "string" }, colors: { type: "array", items: obj({ name: { type: "string" }, hex: { type: "string" } }) }, heading_font: { type: "string" }, body_font: { type: "string" }, tagline: { type: "string" }, voice: { type: "string" }, differentiator: { type: "string" } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const generateProposals = async () => {
    const prompt = "Create 3 distinct proposal templates for selling this business's services to a prospective customer. Each template: a title, an angle, and 3-4 sections each with a heading and body copy. Make it persuasive and ready to customize.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ title: { type: "string" }, angle: { type: "string" }, sections: { type: "array", items: obj({ heading: { type: "string" }, body: { type: "string" } }) } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const generateEmails = async () => {
    const prompt = "Write 3 distinct cold outreach email templates for this business to prospective customers. Each with a subject line and a body. Vary the angle. Keep concise and professional.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ subject: { type: "string" }, body: { type: "string" } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const generateWebsites = async () => {
    const prompt = "Design 3 distinct homepage concepts for a PWA website for this business. Each: a hero headline, a hero subheadline, 3-4 sections (each with a title and copy), and a primary CTA label. Optimize for mobile-first.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ hero_headline: { type: "string" }, hero_sub: { type: "string" }, cta: { type: "string" }, sections: { type: "array", items: obj({ title: { type: "string" }, copy: { type: "string" } }) } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const generateCards = async () => {
    const styles = ["front-cover brochure, bold headline + hero imagery", "tri-fold brochure layout, services + contact", "digital business card, minimalist contact + QR style"];
    const prompts = styles.map((s) => "Marketing brochure design for \"" + savedName + "\", " + onboarding.industry + " industry, " + onboarding.vibe + " style. " + s + ". Professional, print-ready, dark premium aesthetic with the business name visible.");
    return genImages(prompts);
  };

  const generateApps = async () => {
    const prompt = "Conceptualize 3 distinct mobile app ideas for this business to serve its customers. Each: an app name, a list of 4-6 core features, a list of 3-5 primary screens, and a one-line value proposition.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ app_name: { type: "string" }, value_prop: { type: "string" }, core_features: { type: "array", items: { type: "string" } }, primary_screens: { type: "array", items: { type: "string" } } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const generateSocial = async () => {
    const prompt = "Create 3 distinct social media post concepts for this business. Each: a caption (with emojis), 5-8 hashtags, and a 4-second short-form video script (describe the visual scene). Tailor to " + onboarding.vibe + " tone.\n\nContext:\n" + ctx();
    const schema = obj({ options: { type: "array", items: obj({ caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } }, video_script: { type: "string" } }) } }, ["options"]);
    return llmOptions(prompt, schema);
  };

  const renderVideo = async () => {
    if (!savedSocial) return;
    setVideoLoading(true); setVideoUrl(null);
    try {
      const prompt = "A 4-second vertical promotional video for a business named \"" + savedName + "\" in the " + onboarding.industry + " industry. Scene: " + savedSocial.video_script + ". " + onboarding.vibe + " mood, cinematic, high quality, branded.";
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
    { key: "names", label: "Names", done: !!savedName },
    { key: "logo", label: "Logo", done: !!savedLogo },
    { key: "brand", label: "Brand", done: !!savedBrand },
    { key: "proposal", label: "Proposal", done: !!savedProposal },
    { key: "email", label: "Emails", done: !!savedEmail },
    { key: "web", label: "Website", done: !!savedWebsite },
    { key: "card", label: "Card", done: !!savedCard },
    { key: "app", label: "App", done: !!savedApp },
    { key: "social", label: "Social", done: !!savedSocial },
  ];

  const imgBox = { background: "#0b0b0b", overflow: "hidden" };
  const optPad = { padding: 15, display: "grid", gap: 9 };
  const subLabel = { fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--vx-faint)" };
  const divider = { height: 1, background: "var(--vx-border-soft)", margin: "2px 0" };

  return (
    <div style={{ display: "grid", gap: 16, padding: "8px 0 36px" }}>
      {/* Hero header */}
      <div className="vx-card" style={{ padding: 24, position: "relative", overflow: "hidden", borderColor: "#8A7300" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(130% 100% at 0% 0%, rgba(255,214,10,.14), transparent 55%), radial-gradient(120% 120% at 100% 100%, rgba(255,184,0,.08), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--vx-accent), transparent)", opacity: 0.7 }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <span style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 15, display: "grid", placeItems: "center", color: "var(--vx-accent)", border: "1px solid var(--vx-accent)", background: "rgba(255,214,10,.10)", boxShadow: "var(--vx-glow)" }}>
            <Wand2 style={{ width: 28, height: 28 }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <span className="vx-kicker">AI BUSINESS BUILDER</span>
            <h1 style={{ margin: "4px 0 0", fontSize: 30, letterSpacing: "-.035em", fontWeight: 900 }}>Business <span style={{ color: "var(--vx-accent)" }}>Generator</span></h1>
            <p style={{ margin: "7px 0 0", color: "var(--vx-muted)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 520 }}>
              Answer a few questions, generate 10 validated business names, then build your entire brand — logo, proposal, emails, website, app, and social video — three options at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="vx-card-soft" style={{ padding: "13px 15px", display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--vx-muted)", letterSpacing: ".04em", textTransform: "uppercase" }}>Build progress</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--vx-accent)" }}>{steps.filter((s) => s.done).length} / {steps.length}</span>
        </div>
        <div style={{ position: "relative", height: 8, borderRadius: 6, background: "var(--vx-panel-3)", overflow: "hidden", border: "1px solid var(--vx-border-soft)" }}>
          <div style={{ position: "absolute", inset: 0, width: (steps.filter((s) => s.done).length / steps.length * 100) + "%", background: "linear-gradient(90deg, #FFB800, #FFD60A)", boxShadow: "var(--vx-glow)", borderRadius: 6, transition: "width .3s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {steps.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, background: s.done ? "var(--vx-accent)" : "transparent", color: s.done ? "#0A0A0A" : "var(--vx-faint)", border: s.done ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)", boxShadow: s.done ? "var(--vx-glow)" : "none" }}>
                {s.done ? <Check style={{ width: 12, height: 12 }} /> : i + 1}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.done ? "var(--vx-text)" : "var(--vx-faint)", whiteSpace: "nowrap" }}>{s.label}</span>
              {i < steps.length - 1 && <span style={{ width: 12, height: 1, background: "var(--vx-border-soft)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Onboarding */}
      <section className="vx-card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <SectionHead icon={ClipboardList} tag="ONBOARDING" title="Tell us about the business" description="The more detail you give, the better the AI can tailor every name and asset." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <div className="vx-field"><label>City</label><div style={{ display: "flex", gap: 8 }}><input className="vx-input" style={{ flex: 1 }} value={onboarding.city} onChange={set("city")} placeholder="Austin" /><AiFieldButton field="city" onboarding={onboarding} onApply={(v) => setVal("city", v)} /></div></div>
          <div className="vx-field"><label>State</label><div style={{ display: "flex", gap: 8 }}><input className="vx-input" style={{ flex: 1 }} value={onboarding.state} onChange={set("state")} placeholder="TX" /><AiFieldButton field="state" onboarding={onboarding} onApply={(v) => setVal("state", v)} /></div></div>
        </div>
        <div className="vx-field"><label>Industry</label><div style={{ display: "flex", gap: 8 }}><input className="vx-input" style={{ flex: 1 }} value={onboarding.industry} onChange={set("industry")} placeholder="Epoxy floor coatings" /><AiFieldButton field="industry" onboarding={onboarding} onApply={(v) => setVal("industry", v)} /></div></div>
        <div className="vx-field"><label>Specialties</label><div style={{ display: "flex", gap: 8 }}><input className="vx-input" style={{ flex: 1 }} value={onboarding.specialties} onChange={set("specialties")} placeholder="garage floors, commercial polished concrete" /><AiFieldButton field="specialties" onboarding={onboarding} onApply={(v) => setVal("specialties", v)} /></div><span className="vx-help">Comma-separated services or differentiators</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <div className="vx-field"><label>Brand vibe</label><select className="vx-input" value={onboarding.vibe} onChange={set("vibe")}>{VIBES.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
          <div className="vx-field"><label>Name style</label><select className="vx-input" value={onboarding.nameStyle} onChange={set("nameStyle")}>{NAME_STYLES.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
        </div>
        <div className="vx-field"><label>Target customer</label><div style={{ display: "flex", gap: 8 }}><input className="vx-input" style={{ flex: 1 }} value={onboarding.targetCustomer} onChange={set("targetCustomer")} placeholder="homeowners, property managers" /><AiFieldButton field="targetCustomer" onboarding={onboarding} onApply={(v) => setVal("targetCustomer", v)} /></div><span className="vx-help">Who you serve most</span></div>
        <div className="vx-field"><label>Anything else?</label><div style={{ display: "flex", gap: 8 }}><textarea className="vx-input" style={{ flex: 1 }} rows={2} value={onboarding.notes} onChange={set("notes")} placeholder="Keywords to include, names to avoid, founders' initials, etc." /><AiFieldButton field="notes" onboarding={onboarding} onApply={(v) => setVal("notes", v)} /></div></div>
      </section>

      {/* Step 2: Names + validation */}
      <section className="vx-card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <SectionHead icon={Search} tag="NAMING" title="Generate 10 business names" description="Each name is checked against the scraper to see if it's already in use in your area." />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="vx-btn primary" onClick={generateNames} disabled={!onboardingReady || namesLoading}>
            {namesLoading ? <Loader2 className="vx-icon" /> : <Search className="vx-icon" />}
            {namesLoading ? (validating ? "Validating with scraper…" : "Generating…") : "Generate & validate 10 names"}
          </button>
          {!onboardingReady && <span style={{ fontSize: 12, color: "var(--vx-faint)" }}>Fill city, industry, and specialties first.</span>}
        </div>
        {namesError && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{namesError}</p>}

        {names.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {names.map((n, i) => {
              const active = savedName === n.name;
              return (
                <div key={i} onClick={() => setSavedName(n.name)} style={{ cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: 15, borderRadius: 15, border: active ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)", background: active ? "linear-gradient(160deg, var(--vx-accent-soft), var(--vx-panel))" : "var(--vx-panel)", boxShadow: active ? "var(--vx-glow)" : "inset 0 1px rgba(255,255,255,.025)", transition: "border-color .15s, box-shadow .15s, background .15s" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16 }}>{n.name}</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 8, border: n.taken ? "1px solid #7f1a20" : "1px solid #8A7300", color: n.taken ? "#ff858b" : "var(--vx-accent)", background: n.taken ? "rgba(255,82,88,.08)" : "rgba(255,214,10,.06)" }}>
                        {n.taken ? "Possibly taken" : "Likely available"}
                      </span>
                    </div>
                    {n.rationale && <p style={{ margin: "5px 0 0", color: "var(--vx-muted)", fontSize: 12, lineHeight: 1.4 }}>{n.rationale}</p>}
                    {n.tagline && <p style={{ margin: "3px 0 0", color: "var(--vx-accent)", fontSize: 12.5, fontStyle: "italic" }}>“{n.tagline}”</p>}
                  </div>
                  {active && <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center", alignSelf: "start", boxShadow: "var(--vx-glow)" }}><Check style={{ width: 15, height: 15 }} /></span>}
                </div>
              );
            })}
          </div>
        )}

        {savedName && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--vx-accent)", background: "linear-gradient(135deg, rgba(255,214,10,.10), var(--vx-panel))", boxShadow: "var(--vx-glow)" }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center", flexShrink: 0 }}><Check style={{ width: 17, height: 17 }} /></span>
            <span style={{ fontSize: 13, color: "var(--vx-muted)" }}>Approved name: <strong style={{ color: "var(--vx-accent)", fontSize: 16 }}>{savedName}</strong></span>
          </div>
        )}

        {competitors.length > 0 && (
          <div className="vx-card-soft" style={{ padding: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", display: "flex", alignItems: "center", gap: 6 }}><Globe className="vx-icon-sm" /> Competitors already operating in {onboarding.city}:</p>
            <p style={{ margin: "7px 0 0", fontSize: 12, color: "var(--vx-faint)", lineHeight: 1.5 }}>{competitors.slice(0, 12).join(" · ")}</p>
          </div>
        )}
      </section>

      {/* Step 3: Logo */}
      <GeneratorSection index={3} icon={Image} tag="IDENTITY" title="Logo generator" description="3 distinct logo concepts based on your approved name." canGenerate={!!savedName} lockedMessage="Save a business name first." generate={generateLogos} selectedKey={savedLogo?._i} onSelect={(opt, i, save) => setSavedLogo({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ ...imgBox, aspectRatio: "16/10" }}>
          <img src={opt.url} alt="logo option" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )} />

      {/* Step 4: Brand package */}
      <GeneratorSection index={4} icon={Palette} tag="BRAND" title="Brand package generator" description="3 full brand systems — palette, fonts, tagline, voice, differentiator." canGenerate={!!savedName} lockedMessage="Save a business name first." generate={generateBrand} selectedKey={savedBrand?._i} onSelect={(opt, i) => setSavedBrand({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={optPad}>
          <strong style={{ fontSize: 15 }}>{opt.name}</strong>
          <div style={{ display: "flex", gap: 7 }}>
            {(opt.colors || []).map((c, j) => (
              <div key={j} style={{ flex: 1 }}>
                <div title={c.name + " " + c.hex} style={{ height: 34, borderRadius: 9, background: c.hex, border: "1px solid var(--vx-border-soft)" }} />
                <span style={{ fontSize: 10, color: "var(--vx-faint)", display: "block", marginTop: 4, textAlign: "center" }}>{c.hex}</span>
              </div>
            ))}
          </div>
          <div style={divider} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)" }}><span style={subLabel}>Fonts </span><span style={{ color: "var(--vx-text)" }}>{opt.heading_font}</span> / <span style={{ color: "var(--vx-text)" }}>{opt.body_font}</span></p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--vx-accent)", fontStyle: "italic" }}>“{opt.tagline}”</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.45 }}><span style={subLabel}>Voice </span>{opt.voice}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.45 }}><span style={subLabel}>Differentiator </span>{opt.differentiator}</p>
        </div>
      )} />

      {/* Step 5: Proposal */}
      <GeneratorSection index={5} icon={FileText} tag="SALES" title="Proposal generator" description="3 proposal templates to pitch your services." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateProposals} selectedKey={savedProposal?._i} onSelect={(opt, i) => setSavedProposal({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={optPad}>
          <strong style={{ fontSize: 15 }}>{opt.title}</strong>
          <span style={{ fontSize: 11, color: "var(--vx-accent)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>{opt.angle}</span>
          <div style={divider} />
          {(opt.sections || []).map((s, j) => (
            <div key={j}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "var(--vx-text)" }}>{s.heading}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}>{s.body}</p>
            </div>
          ))}
        </div>
      )} />

      {/* Step 6: Emails */}
      <GeneratorSection index={6} icon={Mail} tag="OUTREACH" title="Email template generator" description="3 cold outreach email drafts." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateEmails} selectedKey={savedEmail?._i} onSelect={(opt, i) => setSavedEmail({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={optPad}>
          <strong style={{ fontSize: 13.5, color: "var(--vx-accent)" }}>{opt.subject}</strong>
          <div style={divider} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{opt.body}</p>
        </div>
      )} />

      {/* Step 7: Website / PWA */}
      <GeneratorSection index={7} icon={MonitorSmartphone} tag="WEB" title="Desktop / PWA website generator" description="3 homepage concepts, mobile-first." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateWebsites} selectedKey={savedWebsite?._i} onSelect={(opt, i) => setSavedWebsite({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={optPad}>
          <strong style={{ fontSize: 17, letterSpacing: "-.02em" }}>{opt.hero_headline}</strong>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--vx-muted)", lineHeight: 1.45 }}>{opt.hero_sub}</p>
          <span style={{ fontSize: 11, color: "var(--vx-accent)", fontWeight: 700 }}>CTA: {opt.cta}</span>
          <div style={divider} />
          {(opt.sections || []).map((s, j) => (
            <div key={j}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "var(--vx-text)" }}>{s.title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}>{s.copy}</p>
            </div>
          ))}
        </div>
      )} />

      {/* Step 8: Digital card + brochure */}
      <GeneratorSection index={8} icon={CreditCard} tag="PRINT" title="Digital business card & brochure generator" description="3 brochure/card designs." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateCards} selectedKey={savedCard?._i} onSelect={(opt, i) => setSavedCard({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={{ ...imgBox, aspectRatio: "3/4" }}>
          <img src={opt.url} alt="brochure option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )} />

      {/* Step 9: App concept */}
      <GeneratorSection index={9} icon={Smartphone} tag="PRODUCT" title="App generator" description="3 mobile app concepts for your customers." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateApps} selectedKey={savedApp?._i} onSelect={(opt, i) => setSavedApp({ ...opt, _i: i })} renderOption={(opt) => (
        <div style={optPad}>
          <strong style={{ fontSize: 15 }}>{opt.app_name}</strong>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--vx-accent)" }}>{opt.value_prop}</p>
          <div style={divider} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}><span style={subLabel}>Features </span>{(opt.core_features || []).join(", ")}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}><span style={subLabel}>Screens </span>{(opt.primary_screens || []).join(", ")}</p>
        </div>
      )} />

      {/* Step 10: Social + video */}
      <GeneratorSection index={10} icon={Share2} tag="CONTENT" title="Social media content & video generator" description="3 social post concepts; render a 4s video from your pick." canGenerate={!!savedBrand} lockedMessage="Save a brand package first." generate={generateSocial} selectedKey={savedSocial?._i} onSelect={(opt, i) => { setSavedSocial({ ...opt, _i: i }); setVideoUrl(null); }} renderOption={(opt) => (
        <div style={optPad}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--vx-text)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{opt.caption}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-accent)" }}>{(opt.hashtags || []).join(" ")}</p>
          <div style={divider} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5 }}><span style={subLabel}>Video script </span>{opt.video_script}</p>
        </div>
      )} />

      {savedSocial && (
        <section className="vx-card" style={{ padding: 20, display: "grid", gap: 14, borderColor: "#8A7300", background: "linear-gradient(145deg, var(--vx-panel-2), var(--vx-panel))" }}>
          <SectionHead icon={Film} tag="VIDEO" title="Render your social video" description="Generates a 4-second vertical clip from your selected post concept." />
          <button className="vx-btn primary" onClick={renderVideo} disabled={videoLoading} style={{ alignSelf: "flex-start" }}>
            {videoLoading ? <Loader2 className="vx-icon" /> : <Film className="vx-icon" />}
            {videoLoading ? "Rendering video…" : "Render 4s video"}
          </button>
          {videoUrl && (
            <video src={videoUrl} controls playsInline style={{ width: "100%", maxWidth: 300, borderRadius: 16, border: "1px solid var(--vx-border-soft)", margin: "0 auto", display: "block", boxShadow: "var(--vx-shadow)" }} />
          )}
        </section>
      )}
    </div>
  );
}