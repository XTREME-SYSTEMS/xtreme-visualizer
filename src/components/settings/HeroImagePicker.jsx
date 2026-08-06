import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, RotateCcw } from "lucide-react";

const STORAGE_KEY = "vx-hero-image";
const DEFAULT_HERO =
  "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png";

export function getHeroImage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export default function HeroImagePicker() {
  const [applied, setApplied] = useState(() => getHeroImage());
  const [textValue, setTextValue] = useState(() => getHeroImage());
  const [uploading, setUploading] = useState(false);

  const apply = (newUrl) => {
    setApplied(newUrl);
    setTextValue(newUrl);
    try { localStorage.setItem(STORAGE_KEY, newUrl); } catch {}
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      apply(file_url);
    } catch (err) {
      console.error("Hero image upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleBlur = () => {
    const v = textValue.trim();
    if (v && v !== applied) apply(v);
    else setTextValue(applied);
  };

  const reset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setApplied(DEFAULT_HERO);
    setTextValue(DEFAULT_HERO);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">Upload or paste a URL for the hero image shown on the Home screen.</p>
      <div className="flex gap-3 items-start">
        <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0">
          <img src={applied} alt="Hero preview" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-[12px] font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload image
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <input
            type="text"
            value={textValue}
            placeholder="Paste image URL…"
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-2.5 py-1.5 text-[12px] rounded border border-slate-300 bg-transparent text-slate-200 outline-none focus:border-[var(--vx-accent)]"
          />
        </div>
      </div>
      <button onClick={reset} className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 underline">
        <RotateCcw className="w-3 h-3" /> Reset to default
      </button>
    </div>
  );
}