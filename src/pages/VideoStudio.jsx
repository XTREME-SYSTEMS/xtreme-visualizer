import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GALLERY_CATEGORIES } from "@/data/galleryImages";
import { getLoadingLogo } from "@/components/settings/BrandingCustomizer";
import { getHeroTextConfig } from "@/components/settings/HeroTextCustomizer";
import VideoShareBar from "@/components/video/VideoShareBar";
import {
  Sparkles, Globe, Factory, Search, Image as ImageIcon, Wand2, Film,
  Loader2, Download, RefreshCw, Check, Type, Palette, Clock, Stamp,
} from "lucide-react";

const FONT_PRESETS = [
  { key: "system", label: "System", stack: "sans-serif" },
  { key: "serif", label: "Serif", stack: "Georgia, serif" },
  { key: "display", label: "Display", stack: "Impact, sans-serif" },
  { key: "rounded", label: "Rounded", stack: "\"Avenir Next\", sans-serif" },
];

const LENGTHS = [
  { value: 4, label: "4s", blurb: "Teaser" },
  { value: 6, label: "6s", blurb: "Standard" },
  { value: 8, label: "8s", blurb: "Story" },
];

const ASPECTS = [
  { value: "9:16", label: "Vertical", blurb: "Reels/TikTok" },
  { value: "16:9", label: "Landscape", blurb: "YouTube" },
];

const SOURCES = [
  { key: "website", label: "Website", icon: Globe, blurb: "Pull content from your site URL" },
  { key: "industry", label: "Industry", icon: Factory, blurb: "Describe your trade / niche" },
  { key: "scraper", label: "Scraper", icon: Search, blurb: "Find trending content in your niche" },
  { key: "gallery", label: "Gallery", icon: ImageIcon, blurb: "Use your saved gallery images" },
];

export default function VideoStudio() {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState("website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industryText, setIndustryText] = useState("");
  const [scraperQuery, setScraperQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [scriptData, setScriptData] = useState(null);
  const [chosenHook, setChosenHook] = useState(0);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [length, setLength] = useState(6);
  const [aspect, setAspect] = useState("9:16");
  const [fontKey, setFontKey] = useState("display");
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [accentColor, setAccentColor] = useState("#FFD60A");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState("");

  const logo = getLoadingLogo();
  const brandName = getHeroTextConfig().headingLine1 || "Xtreme";

  const gatherSourceAndAdvance = async () => {
    if (source === "website" && !websiteUrl.trim()) return setError("Enter your website URL.");
    if (source === "industry" && !industryText.trim()) return setError("Describe your industry.");
    if (source === "scraper" && !scraperQuery.trim()) return setError("Enter a search query.");
    if (source === "gallery" && selectedImages.length === 0) return setError("Select at least one gallery image.");
    setError("");
    setBusy(true);
    setBusyLabel("Researching content…");
    try {
      let prompt = "";
      let useWeb = false;
      if (source === "website") {
        prompt = `Research the surface coatings / flooring business at this website: ${websiteUrl}. Summarize their services, value props, and unique selling points for a viral short-form video.`;
        useWeb = true;
      } else if (source === "industry") {
        prompt = `A contractor in this niche wants viral short-form video ideas: "${industryText}". Summarize the top value props, pain points they solve, and angles that go viral.`;
      } else if (source === "scraper") {
        prompt = `Find trending short-form video content and hooks in this niche: "${scraperQuery}". Identify what styles and hooks are currently going viral for contractors in this space.`;
        useWeb = true;
      } else {
        prompt = `A surface coatings contractor wants a viral short-form video using these finished project photos as the visual basis. Describe the aesthetic and craft a viral angle around premium floor transformations.`;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: useWeb,
        model: useWeb ? "gemini_3_flash" : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            hooks: { type: "array", items: { type: "string" } },
            script: { type: "string" },
            visualPrompt: { type: "string" },
          },
        },
      });
      setScriptData(res);
      setVideoPrompt(res.visualPrompt || "");
      setStep(2);
    } catch (e) {
      setError(e?.message || "Failed to gather content.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  };

  const regenerateHooks = async () => {
    setBusy(true);
    setBusyLabel("Generating fresh hooks…");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this content summary: "${scriptData?.summary || ""}". Generate 5 NEW viral hook options for a short-form video, each under 12 words, punchy and scroll-stopping. Return JSON {hooks: [...]}.`,
        response_json_schema: { type: "object", properties: { hooks: { type: "array", items: { type: "string" } } } },
      });
      setScriptData((p) => ({ ...p, hooks: res.hooks }));
      setChosenHook(0);
    } catch (e) {
      setError(e?.message || "Failed to regenerate hooks.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  };

  const generateCover = async () => {
    setBusy(true);
    setBusyLabel("Generating cover image…");
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `${videoPrompt}. Bold promotional cover frame, ${brandName} branding, cinematic lighting, high detail.`,
      });
      setCoverUrl(url);
    } catch (e) {
      setError(e?.message || "Cover generation failed.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) return setError("Video prompt is empty.");
    setError("");
    setBusy(true);
    setBusyLabel(`Rendering ${length}s video…`);
    try {
      const font = FONT_PRESETS.find((f) => f.key === fontKey)?.label || "Display";
      const hook = scriptData?.hooks?.[chosenHook] || "";
      const fullPrompt = [
        videoPrompt,
        `On-screen text hook: "${hook}" rendered in bold ${font} typography, color ${fontColor}, with ${accentColor} accent highlights.`,
        includeLogo ? `Subtly feature the brand logo (${brandName}) as a lower-third watermark.` : "",
        "Cinematic, high-end, viral short-form style, smooth motion, professional color grade.",
      ].filter(Boolean).join(" ");
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: fullPrompt,
        duration: length,
        aspect_ratio: aspect,
        generate_audio: true,
      });
      setVideoUrl(res.url);
      setStep(4);
    } catch (e) {
      setError(e?.message || "Video generation failed.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  };

  const toggleImage = (url) =>
    setSelectedImages((p) => (p.includes(url) ? p.filter((x) => x !== url) : [...p, url]));

  return (
    <div className="page hx-page" style={{ padding: "20px 16px 40px" }}>
      <div className="hx-page-head" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Film size={22} style={{ color: "var(--vx-accent)" }} /> Video Studio
          </h1>
          <p>AI viral video generator — script, storyboard, render, and share.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["Source", "Script", "Style", "Render"].map((label, i) => {
          const n = i + 1;
          const active = step >= n;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 800,
                background: active ? "var(--vx-accent)" : "var(--vx-panel-3)",
                color: active ? "#0A0A0A" : "var(--vx-faint)",
              }}>{n}</span>
              <span style={{ fontSize: 12, color: active ? "var(--vx-text)" : "var(--vx-faint)", fontWeight: 600 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: "rgba(255,82,88,.12)", border: "1px solid var(--vx-danger)", color: "var(--vx-danger)", padding: "10px 12px", borderRadius: 10, fontSize: 12, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="vx-card" style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {SOURCES.map((s) => (
              <button key={s.key} onClick={() => setSource(s.key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                  padding: 14, borderRadius: 12, textAlign: "left",
                  border: `1px solid ${source === s.key ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                  background: source === s.key ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
                }}>
                <s.icon size={20} style={{ color: "var(--vx-accent)" }} />
                <strong style={{ fontSize: 13, color: "var(--vx-text)" }}>{s.label}</strong>
                <span style={{ fontSize: 11, color: "var(--vx-faint)" }}>{s.blurb}</span>
              </button>
            ))}
          </div>

          {source === "website" && (
            <input className="vx-input" placeholder="https://yourcompany.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          )}
          {source === "industry" && (
            <textarea className="vx-input" rows={3} placeholder="e.g. Residential garage epoxy floors in the Midwest, premium flake and metallic systems…" value={industryText} onChange={(e) => setIndustryText(e.target.value)} />
          )}
          {source === "scraper" && (
            <input className="vx-input" placeholder="e.g. garage epoxy trending TikTok hooks" value={scraperQuery} onChange={(e) => setScraperQuery(e.target.value)} />
          )}
          {source === "gallery" && (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {GALLERY_CATEGORIES.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text)", marginBottom: 6 }}>{cat.title}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {cat.images.map((url) => {
                      const on = selectedImages.includes(url);
                      return (
                        <button key={url} onClick={() => toggleImage(url)}
                          style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: `2px solid ${on ? "var(--vx-accent)" : "transparent"}` }}>
                          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {on && <span style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: 999, background: "var(--vx-accent)", color: "#0A0A0A", display: "grid", placeItems: "center" }}><Check size={12} /></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="vx-btn primary" disabled={busy} onClick={gatherSourceAndAdvance}
            style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {busy ? busyLabel : "Generate script with AI"}
          </button>
        </div>
      )}

      {step === 2 && scriptData && (
        <div className="vx-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)" }}><Sparkles size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "var(--vx-accent)" }} />Recommended hooks</p>
              <button onClick={regenerateHooks} disabled={busy} style={{ fontSize: 11, color: "var(--vx-accent)", display: "flex", alignItems: "center", gap: 4 }}>
                {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} New hooks
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {scriptData.hooks?.map((h, i) => (
                <button key={i} onClick={() => setChosenHook(i)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                    border: `1px solid ${chosenHook === i ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                    background: chosenHook === i ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
                    color: "var(--vx-text)",
                  }}>
                  <span style={{ fontWeight: 700, color: "var(--vx-accent)", marginRight: 6 }}>{i + 1}.</span>{h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 6 }}>Script</p>
            <p style={{ fontSize: 12, color: "var(--vx-muted)", lineHeight: 1.5, background: "var(--vx-panel-2)", padding: 10, borderRadius: 8 }}>{scriptData.script}</p>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 6 }}>Visual prompt (editable)</p>
            <textarea className="vx-input" rows={4} value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="vx-btn" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
            <button className="vx-btn primary" onClick={() => setStep(3)} style={{ flex: 1 }}>Style & render →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="vx-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} style={{ color: "var(--vx-accent)" }} />Length</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {LENGTHS.map((l) => (
                <button key={l.value} onClick={() => setLength(l.value)}
                  style={{ padding: 12, borderRadius: 10, textAlign: "center",
                    border: `1px solid ${length === l.value ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                    background: length === l.value ? "var(--vx-accent-soft)" : "var(--vx-panel-2)" }}>
                  <strong style={{ fontSize: 16, color: "var(--vx-text)" }}>{l.label}</strong>
                  <span style={{ display: "block", fontSize: 10, color: "var(--vx-faint)" }}>{l.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 8 }}>Aspect ratio</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ASPECTS.map((a) => (
                <button key={a.value} onClick={() => setAspect(a.value)}
                  style={{ padding: 12, borderRadius: 10, textAlign: "center",
                    border: `1px solid ${aspect === a.value ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                    background: aspect === a.value ? "var(--vx-accent-soft)" : "var(--vx-panel-2)" }}>
                  <strong style={{ fontSize: 13, color: "var(--vx-text)" }}>{a.label}</strong>
                  <span style={{ display: "block", fontSize: 10, color: "var(--vx-faint)" }}>{a.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Type size={14} style={{ color: "var(--vx-accent)" }} />Font style</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {FONT_PRESETS.map((f) => (
                <button key={f.key} onClick={() => setFontKey(f.key)}
                  style={{ padding: "10px 4px", borderRadius: 10, fontSize: 13, fontFamily: f.stack,
                    border: `1px solid ${fontKey === f.key ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                    background: fontKey === f.key ? "var(--vx-accent-soft)" : "var(--vx-panel-2)",
                    color: "var(--vx-text)" }}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: "var(--vx-faint)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Palette size={12} />Text color</p>
              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "transparent" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "var(--vx-faint)", marginBottom: 6 }}>Accent color</p>
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "transparent" }} />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Stamp size={14} style={{ color: "var(--vx-accent)" }} />Branding</p>
            <button onClick={() => setIncludeLogo((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 10, borderRadius: 10,
                border: `1px solid ${includeLogo ? "var(--vx-accent)" : "var(--vx-border-soft)"}`,
                background: includeLogo ? "var(--vx-accent-soft)" : "var(--vx-panel-2)" }}>
              <img src={logo} alt="logo" style={{ height: 28, width: "auto", objectFit: "contain" }} />
              <span style={{ fontSize: 12, color: "var(--vx-text)", flex: 1 }}>{includeLogo ? "Logo watermark included" : "Logo off"}</span>
              <span style={{ width: 40, height: 22, borderRadius: 999, background: includeLogo ? "var(--vx-accent)" : "var(--vx-panel-3)", position: "relative" }}>
                <span style={{ position: "absolute", top: 2, left: includeLogo ? 20 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left .15s" }} />
              </span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="vx-btn" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
            <button className="vx-btn primary" disabled={busy} onClick={generateVideo} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
              {busy ? busyLabel : `Render ${length}s video`}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--vx-faint)", textAlign: "center" }}>Video rendering uses AI credits (~{length * 5} credits) and takes 30–60s.</p>
        </div>
      )}

      {step === 4 && videoUrl && (
        <div className="vx-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <video src={videoUrl} controls autoPlay loop style={{ width: "100%", borderRadius: 12, background: "#000" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={videoUrl} download style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)", color: "var(--vx-text)", fontSize: 12 }}>
              <Download size={14} /> Download
            </a>
            <button className="vx-btn" onClick={generateCover} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} {coverUrl ? "Regenerate cover" : "Generate cover image"}
            </button>
          </div>
          {coverUrl && <img src={coverUrl} alt="cover" style={{ width: "100%", borderRadius: 10 }} />}
          <VideoShareBar url={videoUrl} title={scriptData?.hooks?.[chosenHook] || brandName} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="vx-btn" onClick={() => { setStep(3); setVideoUrl(""); }} style={{ flex: 1 }}>Re-style</button>
            <button className="vx-btn primary" onClick={() => { setStep(1); setVideoUrl(""); setScriptData(null); }} style={{ flex: 1 }}>New video</button>
          </div>
        </div>
      )}
    </div>
  );
}