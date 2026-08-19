import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Wand2, Sparkles, X, Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { GALLERY_CATEGORIES } from "@/data/galleryImages";

const SETTINGS = [
  "residential garage",
  "commercial showroom",
  "modern kitchen",
  "industrial warehouse",
  "retail store",
  "restaurant",
  "basement",
  "patio",
  "luxury home entryway",
  "office lobby",
  "bathroom",
  "pool deck",
];

const COLOR_PRESETS = [
  "charcoal gray",
  "midnight black",
  "silver gray",
  "warm tan",
  "terracotta",
  "deep blue",
  "forest green",
  "rich burgundy",
  "pure white",
  "copper bronze",
  "pearl white",
  "sandstone",
];

const PROMPT_TEMPLATES = {
  "flake-epoxy":
    "Ultra-realistic professional architectural photograph of a {setting} floor with decorative vinyl flake epoxy coating in {color}. Multi-colored vinyl flakes broadcast throughout creating a textured, slip-resistant speckled surface. {details}Photorealistic, 8K resolution, shot with wide-angle lens, natural daylight from windows, high detail showing flake texture and depth, seamless professional installation, no visible seams, crisp clean edges.",
  "metallic-epoxy":
    "Ultra-realistic professional architectural photograph of a {setting} floor with metallic epoxy coating in {color}. Pearlescent metallic pigments create swirling, three-dimensional depth with a luxurious glass-like reflective finish and organic flowing patterns. {details}Photorealistic, 8K resolution, dramatic lighting highlighting the metallic shimmer and depth, high detail, seamless professional installation, mirror-like gloss.",
  "quartz-epoxy":
    "Ultra-realistic professional architectural photograph of a {setting} floor with broadcast quartz epoxy coating in {color}. Durable quartz aggregate creates a textured, anti-slip granular surface with uniform color. {details}Photorealistic, 8K resolution, even lighting, high detail showing the quartz texture, seamless professional installation, commercial-grade finish.",
  "solid-color-epoxy":
    "Ultra-realistic professional architectural photograph of a {setting} floor with a seamless solid-color epoxy coating in {color}. High-gloss, flawless, mirror-like surface with a clean modern look. {details}Photorealistic, 8K resolution, reflections of overhead lighting visible on the glossy surface, high detail, seamless professional installation, pristine finish.",
  "glitter-epoxy":
    "Ultra-realistic professional architectural photograph of a {setting} floor with glitter epoxy coating in {color}. Sparkling glitter flakes embedded in clear epoxy over a colored base, catching light with a dazzling, glamorous shimmer. {details}Photorealistic, 8K resolution, lighting that makes the glitter sparkle, high detail, seamless professional installation.",
  "polished-concrete":
    "Ultra-realistic professional architectural photograph of a {setting} floor with mechanically polished concrete in {color}. High sheen with exposed aggregate, natural stone character, subtle mottling and surface variation. {details}Photorealistic, 8K resolution, natural lighting showing the polished sheen, high detail, industrial-chic aesthetic, professional polish.",
  "stained-concrete":
    "Ultra-realistic professional architectural photograph of a {setting} floor with acid-stained concrete in {color}. Rich, mottled organic tones with natural variation, each section unique with artistic depth. {details}Photorealistic, 8K resolution, warm natural lighting, high detail showing the stained variation, sealed with a satin sheen.",
  "epoxy-countertop":
    "Ultra-realistic professional architectural photograph of an epoxy countertop in a {setting} with a {color} marble-look finish. Seamless, waterproof, glossy surface with veining that mimics natural stone. {details}Photorealistic, 8K resolution, natural lighting, high detail showing the depth and veining, professional installation.",
  "concrete-countertop":
    "Ultra-realistic professional architectural photograph of a hand-troweled concrete countertop in a {setting} with {color} tones. Natural stone character, integrated sink, modern industrial aesthetic with subtle texture. {details}Photorealistic, 8K resolution, natural lighting, high detail, professional craftsmanship.",
};

function buildPrompt(categoryId, color, setting, details) {
  const template = PROMPT_TEMPLATES[categoryId] || PROMPT_TEMPLATES["flake-epoxy"];
  return template
    .replace("{color}", color)
    .replace("{setting}", setting)
    .replace("{details}", details ? details + ". " : "");
}

export default function GalleryImageGenerator({ onGenerated }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("flake-epoxy");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [customColor, setCustomColor] = useState("");
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const category = GALLERY_CATEGORIES.find((c) => c.id === categoryId);
  const finalColor = customColor.trim() || color;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const prompt = buildPrompt(categoryId, finalColor, setting, details);
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      const url = res?.url;
      if (!url) throw new Error("No image returned");
      setPreview({ url, prompt });
    } catch (e) {
      setError(e?.message || "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    setError("");
    try {
      const title = `${category?.title || "Coating"} — ${finalColor} in ${setting}`;
      await base44.entities.GalleryImage.create({
        category_id: categoryId,
        category_title: category?.title || "",
        image_url: preview.url,
        prompt: preview.prompt,
        title,
        color: finalColor,
        setting,
      });
      setPreview(null);
      setOpen(false);
      setDetails("");
      setCustomColor("");
      if (onGenerated) onGenerated();
    } catch (e) {
      setError(e?.message || "Failed to save image");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setError("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "16px 18px",
          borderRadius: 14,
          border: "1px solid var(--vx-accent)",
          background: "linear-gradient(135deg, rgba(240,244,11,.10), var(--vx-panel))",
          boxShadow: "var(--vx-glow)",
          color: "var(--vx-text)",
          cursor: "pointer",
        }}
      >
        <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #7a7e08" }}>
          <Wand2 style={{ width: 20, height: 20, color: "var(--vx-accent)" }} />
        </span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <strong style={{ display: "block", fontSize: 15 }}>Generate Gallery Image</strong>
          <span style={{ fontSize: 12, color: "var(--vx-muted)" }}>AI-powered, industry-specific ultra life-like coating photos</span>
        </div>
        <Sparkles style={{ width: 18, height: 18, color: "var(--vx-accent)" }} />
      </button>
    );
  }

  return (
    <div className="hx-sys-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, borderColor: "#7a7e08" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #7a7e08" }}>
          <Wand2 size={16} style={{ color: "var(--vx-accent)" }} />
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", fontSize: 15 }}>Image Generator</strong>
          <span style={{ fontSize: 11, color: "var(--vx-muted)" }}>Tailored for surface coatings — ultra life-like results</span>
        </div>
        <button onClick={() => { setOpen(false); setPreview(null); }} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel-2)", color: "var(--vx-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>

      {!preview && (
        <>
          <div className="vx-field">
            <label>Coating type</label>
            <select className="vx-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <span className="vx-help">{category?.description}</span>
          </div>

          <div className="vx-field">
            <label>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setCustomColor(""); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: color === c && !customColor ? "1px solid var(--vx-accent)" : "1px solid var(--vx-border-soft)",
                    background: color === c && !customColor ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
                    color: color === c && !customColor ? "var(--vx-accent)" : "var(--vx-muted)",
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <input className="vx-input" value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Or type a custom color…" />
          </div>

          <div className="vx-field">
            <label>Setting / room</label>
            <select className="vx-input" value={setting} onChange={(e) => setSetting(e.target.value)}>
              {SETTINGS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="vx-field">
            <label>Additional details (optional)</label>
            <textarea className="vx-input" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. with a car parked inside, modern minimalist decor, large windows…" />
          </div>

          {error && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{error}</p>}

          <button className="vx-btn primary" onClick={handleGenerate} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? "Generating ultra life-like image…" : "Generate image"}
          </button>
        </>
      )}

      {preview && (
        <>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--vx-border-soft)", aspectRatio: "4 / 3" }}>
            <Image src={preview.url} alt="Generated coating" fittingType="fill" className="w-full h-full" />
          </div>
          <div style={{ padding: 10, borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vx-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>Prompt</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.45 }}>{preview.prompt}</p>
          </div>
          {error && <p style={{ color: "var(--vx-danger)", fontSize: 12, margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="vx-btn" onClick={handleReset} disabled={loading} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Wand2 size={16} /> Regenerate
            </button>
            <button className="vx-btn primary" onClick={handleSave} disabled={loading} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save to gallery
            </button>
          </div>
        </>
      )}
    </div>
  );
}