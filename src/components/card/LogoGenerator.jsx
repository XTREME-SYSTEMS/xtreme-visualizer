import React, { useState } from "react";
import { Sparkles, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LogoGenerator({ logoUrl, setLogoUrl, companyName, notify }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const p = prompt || `Minimalist professional logo for ${companyName || "a floor coating company"}, modern clean vector style, bold, high contrast, simple icon mark`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: p });
      setLogoUrl(url);
      notify && notify("Logo generated");
    } catch (e) {
      notify && notify("Logo generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><Sparkles size={15} /> AI Logo Generator</div>
      <input className="hx-scraper-input" placeholder="Describe your logo style (optional)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="hx-bid-logo-row">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid var(--vx-border-soft)" }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, border: "1px dashed var(--vx-border)", display: "grid", placeItems: "center", color: "#707070", fontSize: 10 }}>LOGO</div>
        )}
        <button className="hx-bid-logo-btn" onClick={generate} disabled={loading}>
          {loading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {logoUrl ? "Regenerate" : "Generate"}
        </button>
        {logoUrl && (
          <button className="hx-bid-logo-btn" style={{ color: "var(--vx-danger)", borderColor: "var(--vx-danger)" }} onClick={() => setLogoUrl("")}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}