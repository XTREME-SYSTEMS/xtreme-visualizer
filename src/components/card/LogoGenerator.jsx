import React, { useRef, useState } from "react";
import { Sparkles, Loader2, Trash2, Upload, Wand2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LogoGenerator({ logoUrl, setLogoUrl, companyName, notify }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(null); // null | "upload" | "generate" | "enhance"
  const fileRef = useRef(null);

  const attach = async (file) => {
    if (!file) return;
    setLoading("upload");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      notify && notify("Logo attached");
    } catch (e) {
      notify && notify("Upload failed");
    } finally {
      setLoading(null);
    }
  };

  const generate = async () => {
    setLoading("generate");
    try {
      const p = prompt || `Minimalist professional logo for ${companyName || "a floor coating company"}, modern clean vector style, bold, high contrast, simple icon mark`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: p });
      setLogoUrl(url);
      notify && notify("Logo generated");
    } catch (e) {
      notify && notify("Logo generation failed");
    } finally {
      setLoading(null);
    }
  };

  const enhance = async () => {
    if (!logoUrl) return;
    setLoading("enhance");
    try {
      const p = prompt || `Enhance and refine this logo for ${companyName || "a floor coating company"}, keep the core concept and layout, improve clarity, crisp vector lines, professional polish, high contrast, clean modern style`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: p, existing_image_urls: [logoUrl] });
      setLogoUrl(url);
      notify && notify("Logo enhanced");
    } catch (e) {
      notify && notify("Enhancement failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><Sparkles size={15} /> Logo</div>
      <input className="hx-scraper-input" placeholder="Describe your logo style (optional)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="hx-bid-logo-row">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid var(--vx-border-soft)" }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, border: "1px dashed var(--vx-border)", display: "grid", placeItems: "center", color: "#707070", fontSize: 10 }}>LOGO</div>
        )}
        <button className="hx-bid-logo-btn" onClick={() => fileRef.current?.click()} disabled={!!loading}>
          {loading === "upload" ? <Loader2 size={13} className="spin" /> : <Upload size={13} />} Attach
        </button>
        <button className="hx-bid-logo-btn" onClick={generate} disabled={!!loading}>
          {loading === "generate" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {logoUrl ? "Regenerate" : "Generate"}
        </button>
        {logoUrl && (
          <button className="hx-bid-logo-btn" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)" }} onClick={enhance} disabled={!!loading}>
            {loading === "enhance" ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />} Enhance
          </button>
        )}
        {logoUrl && (
          <button className="hx-bid-logo-btn" style={{ color: "var(--vx-danger)", borderColor: "var(--vx-danger)" }} onClick={() => setLogoUrl("")} disabled={!!loading}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {logoUrl && (
        <p style={{ fontSize: 11, color: "var(--vx-faint)", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <Check size={11} style={{ color: "var(--vx-accent)" }} /> Logo is set. Click <strong style={{ color: "var(--vx-accent)" }}>Enhance</strong> to refine it with AI, or keep it as-is.
        </p>
      )}
    </div>
  );
}