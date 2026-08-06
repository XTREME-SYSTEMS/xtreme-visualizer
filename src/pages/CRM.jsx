import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CreditCard, FileText, Bookmark, Save, Trash2, Plus, X, Sparkles, Palette } from "lucide-react";
import CompanyScraper from "@/components/card/CompanyScraper";
import LogoGenerator from "@/components/card/LogoGenerator";
import QrGenerator from "@/components/card/QrGenerator";
import ImagePicker from "@/components/card/ImagePicker";
import ShareBar from "@/components/card/ShareBar";

const FONTS = ["Inter, sans-serif", "Georgia, serif", "Arial, sans-serif", "Courier New, monospace"];
const LAYOUTS = ["modern", "classic", "bold"];

const empty = {
  name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  tagline: "", bio: "", services: [],
  social: { facebook: "", instagram: "", linkedin: "" },
  brochure_sections: [
    { heading: "About Us", body: "" },
    { heading: "Our Services", body: "" },
    { heading: "Why Choose Us", body: "" },
  ],
};

export default function CRM() {
  const [tab, setTab] = useState("card");
  const [assets, setAssets] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(empty);
  const [logoUrl, setLogoUrl] = useState("");
  const [images, setImages] = useState([]);
  const [qrData, setQrData] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0A0A0A");
  const [accentColor, setAccentColor] = useState("#9cff00");
  const [font, setFont] = useState(FONTS[0]);
  const [layout, setLayout] = useState("modern");
  const [serviceInput, setServiceInput] = useState("");

  const notify = (msg) => {
    const t = document.createElement("div");
    t.className = "vx-toast"; t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  const load = () => base44.entities.MarketingAsset.list("-created_date", 50).then(setAssets).catch(() => setAssets([]));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
  const setSocial = (k, v) => setCfg((p) => ({ ...p, social: { ...p.social, [k]: v } }));
  const setSection = (i, k, v) => setCfg((p) => {
    const s = [...p.brochure_sections]; s[i] = { ...s[i], [k]: v }; return { ...p, brochure_sections: s };
  });
  const addService = () => { if (serviceInput.trim()) { set("services", [...cfg.services, serviceInput.trim()]); setServiceInput(""); } };
  const removeService = (i) => set("services", cfg.services.filter((_, x) => x !== i));

  const populate = (data) => {
    setCfg((p) => ({
      ...p,
      company: data.company_name || p.company,
      tagline: data.tagline || p.tagline,
      bio: data.bio || p.bio,
      services: data.services || p.services,
      phone: data.phone || p.phone,
      email: data.email || p.email,
      address: data.address || p.address,
      website: data.website || p.website,
      social: { ...p.social, ...(data.social || {}) },
    }));
    if (data.website && !qrData) setQrData(data.website);
  };

  const aiEnhance = async () => {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Improve this business card/brochure copy for a floor coating company. Make the tagline punchy, the bio compelling (2-3 sentences), and refine services. Current: company="${cfg.company}", tagline="${cfg.tagline}", bio="${cfg.bio}", services=[${cfg.services.join(", ")}]. Return JSON with tagline, bio, services (array).`,
        response_json_schema: { type: "object", properties: { tagline: { type: "string" }, bio: { type: "string" }, services: { type: "array", items: { type: "string" } } } },
      });
      setCfg((p) => ({ ...p, tagline: res.tagline || p.tagline, bio: res.bio || p.bio, services: res.services || p.services }));
      notify("Copy enhanced");
    } catch { notify("Enhance failed"); }
  };

  const save = async () => {
    if (!cfg.company && !cfg.name) { notify("Add a name or company first"); return; }
    setSaving(true);
    try {
      const payload = {
        type: tab === "brochure" ? "brochure" : "digital_card",
        name: cfg.company || cfg.name || "Untitled",
        config: { ...cfg, font, layout },
        logo_url: logoUrl,
        images,
        qr_data: qrData,
        qr_url: qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}` : "",
        primary_color: primaryColor,
        accent_color: accentColor,
        status: "draft",
      };
      if (editingId) await base44.entities.MarketingAsset.update(editingId, payload);
      else { const created = await base44.entities.MarketingAsset.create(payload); setEditingId(created.id); }
      notify("Saved");
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const loadAsset = (a) => {
    setTab(a.type === "brochure" ? "brochure" : "card");
    setEditingId(a.id);
    setCfg({ ...empty, ...(a.config || {}) });
    setLogoUrl(a.logo_url || "");
    setImages(a.images || []);
    setQrData(a.qr_data || "");
    setPrimaryColor(a.primary_color || "#0A0A0A");
    setAccentColor(a.accent_color || "#9cff00");
    setFont(a.config?.font || FONTS[0]);
    setLayout(a.config?.layout || "modern");
  };

  const newAsset = () => {
    setEditingId(null); setCfg(empty); setLogoUrl(""); setImages([]); setQrData(""); setPrimaryColor("#0A0A0A"); setAccentColor("#9cff00");
  };

  const removeAsset = async (a) => {
    await base44.entities.MarketingAsset.delete(a.id);
    if (editingId === a.id) newAsset();
    load();
  };

  const shareText = tab === "brochure"
    ? `${cfg.company || "Our Company"} — ${cfg.tagline || ""}\n${cfg.bio || ""}\n${cfg.phone || ""} | ${cfg.email || ""}`
    : `${cfg.name || cfg.company} — ${cfg.title || ""}\n${cfg.phone || ""} | ${cfg.email || ""}${cfg.website ? " | " + cfg.website : ""}`;

  const cardStyle = { background: primaryColor, color: "#fff", fontFamily: font, borderRadius: 16, overflow: "hidden", border: `1px solid ${accentColor}40` };

  return (
    <div className="hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Digital Card Studio</h1>
          <p>AI-enhanced digital business cards & brochures with QR, logo, and sharing.</p>
        </div>
        <button className="hx-mini-btn dark" onClick={newAsset}><Plus size={15} /> New</button>
      </div>

      <div className="hx-depth-row" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <button className={"hx-depth" + (tab === "card" ? " active" : "")} onClick={() => setTab("card")}><strong><CreditCard size={14} style={{ verticalAlign: "middle" }} /> Card</strong></button>
        <button className={"hx-depth" + (tab === "brochure" ? " active" : "")} onClick={() => setTab("brochure")}><strong><FileText size={14} style={{ verticalAlign: "middle" }} /> Brochure</strong></button>
        <button className={"hx-depth" + (tab === "saved" ? " active" : "")} onClick={() => setTab("saved")}><strong><Bookmark size={14} style={{ verticalAlign: "middle" }} /> Saved</strong></button>
      </div>

      {tab === "saved" ? (
        <div className="hx-list">
          {!assets ? <div className="hx-loading"><Loader2 className="spin" size={20} /></div> :
           assets.length === 0 ? <div className="hx-empty"><span>📑</span>No saved assets yet. Create a card or brochure and save it.</div> :
           assets.map((a) => (
             <div key={a.id} className="hx-sys-card" style={{ cursor: "pointer" }} onClick={() => loadAsset(a)}>
               <div className="hx-sys-head">
                 <div className="hx-sys-title">
                   <div className="hx-sys-icon">{a.type === "brochure" ? <FileText size={18} /> : <CreditCard size={18} />}</div>
                   <div><strong>{a.name}</strong><span>{a.type === "brochure" ? "Brochure" : "Digital Card"} · {a.status}</span></div>
                 </div>
                 <button className="hx-lead-delete" onClick={(e) => { e.stopPropagation(); removeAsset(a); }}><Trash2 size={14} /></button>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <>
          <CompanyScraper onPopulate={populate} notify={notify} />

          <div className="hx-scraper-form">
            <div className="hx-bid-input-label"><Palette size={15} /> Design & Colors</div>
            <div className="form-grid two">
              <div className="field"><label>Primary (background)</label><input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ height: 44, padding: 4 }} /></div>
              <div className="field"><label>Accent</label><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ height: 44, padding: 4 }} /></div>
            </div>
            <div className="form-grid two">
              <div className="field"><label>Font</label><select value={font} onChange={(e) => setFont(e.target.value)}>{FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}</select></div>
              <div className="field"><label>Layout</label><select value={layout} onChange={(e) => setLayout(e.target.value)}>{LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            </div>
          </div>

          <LogoGenerator logoUrl={logoUrl} setLogoUrl={setLogoUrl} companyName={cfg.company} notify={notify} />

          <div className="hx-scraper-form">
            <div className="hx-bid-input-label"><Sparkles size={15} /> Content</div>
            <div className="form-grid two">
              <div className="field"><label>{tab === "card" ? "Full name" : "Company"}</label><input value={tab === "card" ? cfg.name : cfg.company} onChange={(e) => set(tab === "card" ? "name" : "company", e.target.value)} /></div>
              <div className="field"><label>{tab === "card" ? "Title" : "Tagline"}</label><input value={tab === "card" ? cfg.title : cfg.tagline} onChange={(e) => set(tab === "card" ? "title" : "tagline", e.target.value)} /></div>
            </div>
            {tab === "card" && <div className="field"><label>Company</label><input value={cfg.company} onChange={(e) => set("company", e.target.value)} /></div>}
            <div className="form-grid two">
              <div className="field"><label>Phone</label><input value={cfg.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="field"><label>Email</label><input value={cfg.email} onChange={(e) => set("email", e.target.value)} /></div>
            </div>
            <div className="form-grid two">
              <div className="field"><label>Website</label><input value={cfg.website} onChange={(e) => set("website", e.target.value)} /></div>
              <div className="field"><label>Address</label><input value={cfg.address} onChange={(e) => set("address", e.target.value)} /></div>
            </div>
            <div className="field"><label>Bio / About</label><textarea className="hx-bid-textarea" value={cfg.bio} onChange={(e) => set("bio", e.target.value)} /></div>

            <div className="field"><label>Services</label>
              <div className="hx-sys-chips">
                {cfg.services.map((s, i) => <span key={i} className="hx-sys-chip" style={{ cursor: "pointer" }} onClick={() => removeService(i)}>{s} <X size={10} style={{ verticalAlign: "middle" }} /></span>)}
              </div>
              <div className="hx-scraper-row" style={{ marginTop: 6 }}>
                <input className="hx-scraper-input" placeholder="Add a service" value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addService()} />
                <button className="hx-bid-logo-btn" onClick={addService}><Plus size={13} /></button>
              </div>
            </div>

            <div className="form-grid two">
              <div className="field"><label>Facebook</label><input value={cfg.social.facebook} onChange={(e) => setSocial("facebook", e.target.value)} /></div>
              <div className="field"><label>Instagram</label><input value={cfg.social.instagram} onChange={(e) => setSocial("instagram", e.target.value)} /></div>
            </div>
            <div className="field"><label>LinkedIn</label><input value={cfg.social.linkedin} onChange={(e) => setSocial("linkedin", e.target.value)} /></div>

            <button className="gold-button" style={{ justifyContent: "center", marginTop: 8 }} onClick={aiEnhance}>
              <Sparkles size={15} /> AI Enhance Copy
            </button>
          </div>

          {tab === "brochure" && (
            <div className="hx-scraper-form">
              <div className="hx-bid-input-label"><FileText size={15} /> Brochure Sections</div>
              {cfg.brochure_sections.map((s, i) => (
                <div key={i} style={{ display: "grid", gap: 6 }}>
                  <input className="hx-scraper-input" placeholder="Section heading" value={s.heading} onChange={(e) => setSection(i, "heading", e.target.value)} />
                  <textarea className="hx-bid-textarea" placeholder="Section body" value={s.body} onChange={(e) => setSection(i, "body", e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {tab === "brochure" && <ImagePicker images={images} setImages={setImages} notify={notify} />}

          <QrGenerator qrData={qrData} setQrData={setQrData} />

          {/* Live Preview */}
          <div className="hx-sys-card">
            <h3 style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 10px" }}>Live Preview</h3>
            {tab === "card" ? (
              <div style={cardStyle}>
                <div style={{ height: 6, background: accentColor }} />
                <div style={{ padding: 18, display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {logoUrl ? <img src={logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", background: "#fff", padding: 2 }} /> :
                      <div style={{ width: 52, height: 52, borderRadius: 10, border: `1px solid ${accentColor}`, display: "grid", placeItems: "center", color: accentColor, fontWeight: 900 }}>{(cfg.company || "C")[0]}</div>}
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 18, display: "block" }}>{cfg.name || "Your Name"}</strong>
                      <span style={{ fontSize: 12, opacity: .8 }}>{cfg.title || "Title"}{cfg.company ? ` · ${cfg.company}` : ""}</span>
                    </div>
                  </div>
                  {cfg.tagline && <p style={{ margin: 0, fontSize: 12, fontStyle: "italic", opacity: .85, borderLeft: `2px solid ${accentColor}`, paddingLeft: 8 }}>{cfg.tagline}</p>}
                  <div style={{ fontSize: 12, display: "grid", gap: 4, opacity: .9 }}>
                    {cfg.phone && <span>📞 {cfg.phone}</span>}
                    {cfg.email && <span>✉ {cfg.email}</span>}
                    {cfg.website && <span>🌐 {cfg.website}</span>}
                    {cfg.address && <span>📍 {cfg.address}</span>}
                  </div>
                  {qrData && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}`} alt="QR" style={{ width: 70, height: 70, borderRadius: 8, background: "#fff", padding: 4, justifySelf: "start" }} />}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", color: "#111", fontFamily: font, borderRadius: 12, overflow: "hidden", border: `1px solid ${accentColor}40` }}>
                <div style={{ background: primaryColor, color: "#fff", padding: 22, textAlign: "center" }}>
                  {logoUrl && <img src={logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", margin: "0 auto 10px", background: "#fff", padding: 3 }} />}
                  <strong style={{ fontSize: 22, display: "block" }}>{cfg.company || "Your Company"}</strong>
                  {cfg.tagline && <span style={{ fontSize: 13, opacity: .85 }}>{cfg.tagline}</span>}
                </div>
                <div style={{ padding: 18, display: "grid", gap: 14 }}>
                  {cfg.bio && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{cfg.bio}</p>}
                  {cfg.services.length > 0 && (
                    <div><strong style={{ fontSize: 13, color: accentColor, textTransform: "uppercase" }}>Services</strong>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>{cfg.services.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {cfg.brochure_sections.filter((s) => s.body).map((s, i) => (
                    <div key={i}><strong style={{ fontSize: 13, color: accentColor }}>{s.heading}</strong><p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.5 }}>{s.body}</p></div>
                  ))}
                  {images.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {images.slice(0, 4).map((img, i) => <img key={i} src={img.url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />)}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${accentColor}40`, paddingTop: 12, fontSize: 12 }}>
                    <div><div>{cfg.phone}</div><div>{cfg.email}</div><div>{cfg.website}</div></div>
                    {qrData && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(qrData)}`} alt="QR" style={{ width: 64, height: 64 }} />}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hx-bid-controls">
            <button className="gold-button" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {editingId ? "Update" : "Save"}
            </button>
          </div>

          <ShareBar assetName={cfg.company || cfg.name || "My Business"} assetId={editingId} shareText={shareText} qrData={qrData} notify={notify} />
        </>
      )}
    </div>
  );
}