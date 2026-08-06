import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, RotateCcw, Save, Check } from "lucide-react";

const LOGO_KEY = "vx-loading-logo";
const HOME_BTN_KEY = "vx-home-button";
const DL_BTN_KEY = "vx-download-button";

const DEFAULTS = {
  logo: "/logo.png",
  homeButton: { label: "New Visualization" },
  downloadButton: { label: "Install Xtreme" },
};

export function getLoadingLogo() {
  try { return localStorage.getItem(LOGO_KEY) || DEFAULTS.logo; } catch { return DEFAULTS.logo; }
}
export function getHomeButtonConfig() {
  try {
    const raw = localStorage.getItem(HOME_BTN_KEY);
    if (!raw) return DEFAULTS.homeButton;
    return { ...DEFAULTS.homeButton, ...JSON.parse(raw) };
  } catch { return DEFAULTS.homeButton; }
}
export function getDownloadButtonConfig() {
  try {
    const raw = localStorage.getItem(DL_BTN_KEY);
    if (!raw) return DEFAULTS.downloadButton;
    return { ...DEFAULTS.downloadButton, ...JSON.parse(raw) };
  } catch { return DEFAULTS.downloadButton; }
}

export default function BrandingCustomizer() {
  const [draftLogo, setDraftLogo] = useState(() => getLoadingLogo());
  const [savedLogo, setSavedLogo] = useState(() => getLoadingLogo());
  const [logoText, setLogoText] = useState(() => getLoadingLogo());
  const [draftHome, setDraftHome] = useState(() => getHomeButtonConfig());
  const [savedHome, setSavedHome] = useState(() => getHomeButtonConfig());
  const [draftDl, setDraftDl] = useState(() => getDownloadButtonConfig());
  const [savedDl, setSavedDl] = useState(() => getDownloadButtonConfig());
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

  const isDirty =
    draftLogo !== savedLogo ||
    JSON.stringify(draftHome) !== JSON.stringify(savedHome) ||
    JSON.stringify(draftDl) !== JSON.stringify(savedDl);

  const save = () => {
    try {
      localStorage.setItem(LOGO_KEY, draftLogo);
      localStorage.setItem(HOME_BTN_KEY, JSON.stringify(draftHome));
      localStorage.setItem(DL_BTN_KEY, JSON.stringify(draftDl));
    } catch {}
    setSavedLogo(draftLogo);
    setSavedHome(draftHome);
    setSavedDl(draftDl);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const reset = () => {
    setDraftLogo(DEFAULTS.logo);
    setLogoText(DEFAULTS.logo);
    setDraftHome(DEFAULTS.homeButton);
    setDraftDl(DEFAULTS.downloadButton);
  };

  return (
    <div className="space-y-5">
      {/* Loading screen icon */}
      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-slate-700">Loading screen icon</p>
        <p className="text-[12px] text-slate-500">Shown on the startup loading screen.</p>
        <div className="flex gap-3 items-start">
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 grid place-items-center p-2">
            <img src={draftLogo} alt="Loading logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-[12px] font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
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
              className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
            />
          </div>
        </div>
      </div>

      {/* Home screen button */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Home screen button</p>
        <p className="text-[12px] text-slate-500">The primary call-to-action on the Home hero.</p>
        <input
          type="text"
          value={draftHome.label}
          placeholder="Button label"
          onChange={(e) => setDraftHome((p) => ({ ...p, label: e.target.value }))}
          className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
        />
      </div>

      {/* Download button */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        <p className="text-[13px] font-semibold text-slate-700">Download / install button</p>
        <p className="text-[12px] text-slate-500">The install prompt banner shown to mobile users.</p>
        <input
          type="text"
          value={draftDl.label}
          placeholder="Button label"
          onChange={(e) => setDraftDl((p) => ({ ...p, label: e.target.value }))}
          className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
        />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
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
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 underline">
          <RotateCcw className="w-3 h-3" /> Reset to default
        </button>
      </div>
    </div>
  );
}