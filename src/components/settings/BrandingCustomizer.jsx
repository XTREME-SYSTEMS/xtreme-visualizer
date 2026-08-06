import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, RotateCcw, Save, Check } from "lucide-react";
import { getPWAButtonConfig } from "@/components/settings/PWAButtonCustomizer";
import { getHeroTextConfig } from "@/components/settings/HeroTextCustomizer";

const LOGO_KEY = "vx-loading-logo";

const DEFAULTS = {
  logo: "/logo.png",
};

export function getLoadingLogo() {
  try { return localStorage.getItem(LOGO_KEY) || DEFAULTS.logo; } catch { return DEFAULTS.logo; }
}
// Kept for backward compatibility — the hero button label now lives in the Hero text customizer
export function getHomeButtonConfig() {
  return { label: getHeroTextConfig().buttonLabel };
}
// Kept for backward compatibility — delegates to the dedicated PWA button customizer
export function getDownloadButtonConfig() {
  return getPWAButtonConfig();
}

export default function BrandingCustomizer() {
  const [draftLogo, setDraftLogo] = useState(() => getLoadingLogo());
  const [savedLogo, setSavedLogo] = useState(() => getLoadingLogo());
  const [logoText, setLogoText] = useState(() => getLoadingLogo());
  const [uploading, setUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stageLogo = (url) => { setDraftLogo(url); setLogoText(url); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      stageLogo(file_url);
    } catch (err) {
      console.error("Logo upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoBlur = () => {
    const v = logoText.trim();
    if (v) stageLogo(v);
    else setLogoText(draftLogo);
  };

  const isDirty = draftLogo !== savedLogo;

  const save = () => {
    try {
      localStorage.setItem(LOGO_KEY, draftLogo);
    } catch {}
    setSavedLogo(draftLogo);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const reset = () => {
    setDraftLogo(DEFAULTS.logo);
    setLogoText(DEFAULTS.logo);
  };

  return (
    <div className="space-y-5">
      {/* Loading screen icon */}
      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-[var(--vx-text)]">Loading screen icon</p>
        <p className="text-[12px] text-[var(--vx-muted)]">Shown on the startup loading screen.</p>
        <div className="flex gap-3 items-start">
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-[var(--vx-border-soft)] bg-[var(--vx-panel-2)] shrink-0 grid place-items-center p-2">
            <img src={draftLogo} alt="Loading logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--vx-accent)] text-[#0A0A0A] text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload icon
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <input
              type="text"
              value={logoText}
              placeholder="Paste image URL…"
              onChange={(e) => setLogoText(e.target.value)}
              onBlur={handleLogoBlur}
              className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[var(--vx-border-soft)] bg-transparent text-[var(--vx-text)] outline-none focus:border-[var(--vx-accent)]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--vx-border-soft)]">
        <button
          onClick={save}
          disabled={!isDirty && !savedFlash}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-colors"
          style={{
            background: isDirty || savedFlash ? "var(--vx-accent)" : "var(--vx-panel-3)",
            color: isDirty || savedFlash ? "#0A0A0A" : "var(--vx-faint)",
            border: "1px solid var(--vx-accent)",
            cursor: isDirty ? "pointer" : "default",
          }}
        >
          {savedFlash ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {savedFlash ? "Saved!" : "Save"}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--vx-muted)] hover:text-[var(--vx-text)] underline">
          <RotateCcw className="w-3 h-3" /> Reset to default
        </button>
      </div>
    </div>
  );
}