import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, RotateCcw, ChevronDown, ChevronUp, Save, Check } from "lucide-react";
import { GALLERY_CATEGORIES } from "@/data/galleryImages";

const STORAGE_KEY = "vx-hero-image";
const FILTERS_KEY = "vx-hero-filters";
const DEFAULT_HERO =
  "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png";

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  darken: 35,
};

export function getHeroImage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export function getHeroFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function heroFilterString(f) {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`;
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full outline-none"
        style={{ background: "var(--vx-panel-3)" }}
      />
    </div>
  );
}

export default function HeroImagePicker() {
  const [draftImg, setDraftImg] = useState(() => getHeroImage());
  const [textValue, setTextValue] = useState(() => getHeroImage());
  const [savedImg, setSavedImg] = useState(() => getHeroImage());
  const [draftFilters, setDraftFilters] = useState(() => getHeroFilters());
  const [savedFilters, setSavedFilters] = useState(() => getHeroFilters());
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stageImg = (url) => {
    setDraftImg(url);
    setTextValue(url);
  };

  const updateFilter = (key, val) => {
    setDraftFilters((prev) => ({ ...prev, [key]: val }));
  };

  const isDirty = draftImg !== savedImg || JSON.stringify(draftFilters) !== JSON.stringify(savedFilters);

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, draftImg);
      localStorage.setItem(FILTERS_KEY, JSON.stringify(draftFilters));
    } catch {}
    setSavedImg(draftImg);
    setSavedFilters(draftFilters);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const resetFilters = () => setDraftFilters(DEFAULT_FILTERS);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      stageImg(file_url);
    } catch (err) {
      console.error("Hero image upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleBlur = () => {
    const v = textValue.trim();
    if (v) stageImg(v);
    else setTextValue(draftImg);
  };

  const reset = () => {
    stageImg(DEFAULT_HERO);
    setDraftFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">Upload or paste a URL for the hero image shown on the Home screen. Click <strong>Save</strong> to keep your changes.</p>
      <div className="flex gap-3 items-start">
        <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 relative">
          <img src={draftImg} alt="Hero preview" className="w-full h-full object-cover" style={{ filter: heroFilterString(draftFilters) }} />
          <div style={{ position: "absolute", inset: 0, background: "#000", opacity: draftFilters.darken / 100, pointerEvents: "none" }} />
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

      <div className="flex items-center gap-2">
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

      <div className="pt-3 border-t border-slate-200 space-y-3">
        <p className="text-[13px] font-semibold text-slate-700">Image adjustments</p>
        <Slider label="Brightness" value={draftFilters.brightness} min={20} max={180} step={5} unit="%" onChange={(v) => updateFilter("brightness", v)} />
        <Slider label="Contrast" value={draftFilters.contrast} min={20} max={180} step={5} unit="%" onChange={(v) => updateFilter("contrast", v)} />
        <Slider label="Saturation" value={draftFilters.saturate} min={0} max={200} step={5} unit="%" onChange={(v) => updateFilter("saturate", v)} />
        <Slider label="Blur" value={draftFilters.blur} min={0} max={12} step={0.5} unit="px" onChange={(v) => updateFilter("blur", v)} />
        <Slider label="Darken overlay" value={draftFilters.darken} min={0} max={80} step={5} unit="%" onChange={(v) => updateFilter("darken", v)} />
        <button onClick={resetFilters} className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 underline">
          <RotateCcw className="w-3 h-3" /> Reset adjustments
        </button>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <button
          onClick={() => setGalleryOpen((v) => !v)}
          className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 w-full"
        >
          {galleryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Pick from Gallery
        </button>
        {galleryOpen && (
          <div className="mt-3 space-y-4 max-h-80 overflow-y-auto pr-1">
            {GALLERY_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">{cat.title}</p>
                <div className="grid grid-cols-4 gap-2">
                  {cat.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => stageImg(img)}
                      className="aspect-square rounded-md overflow-hidden border-2 transition-transform hover:scale-105"
                      style={{
                        borderColor: draftImg === img ? "var(--vx-accent)" : "transparent",
                        padding: 0,
                        background: "#f1f5f9",
                      }}
                    >
                      <img src={img} alt={`${cat.title} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}