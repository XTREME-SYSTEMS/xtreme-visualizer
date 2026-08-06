import React, { useState, useRef } from "react";
import { Upload, Sparkles, Image as ImageIcon, Loader2, X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImagePicker({ images, setImages, notify }) {
  const [mode, setMode] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState([]);
  const fileRef = useRef(null);

  const attach = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImages((arr) => [...arr, { url: file_url, caption: "" }]);
      notify && notify("Image attached");
    } catch (e) { notify && notify("Upload failed"); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: prompt || "Ultra realistic epoxy floor coating showroom, professional photography, high detail" });
      setImages((arr) => [...arr, { url, caption: "AI generated" }]);
      notify && notify("Image generated");
      setPrompt("");
      setMode(null);
    } catch (e) { notify && notify("Generation failed"); }
    finally { setLoading(false); }
  };

  const loadGallery = async () => {
    setMode("gallery");
    try {
      const [systems, projects] = await Promise.all([
        base44.entities.FloorSystem.list("-created_date", 50).catch(() => []),
        base44.entities.Project.list("-created_date", 50).catch(() => []),
      ]);
      const imgs = [];
      systems.forEach((s) => {
        (s.colors || []).forEach((c) => {
          if (c.image_url) imgs.push({ url: c.image_url, caption: `${s.name} — ${c.name || ""}` });
        });
      });
      projects.forEach((p) => {
        if (p.project_image_url) imgs.push({ url: p.project_image_url, caption: p.name });
      });
      setGallery(imgs);
    } catch (e) { notify && notify("Gallery load failed"); }
  };

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><ImageIcon size={15} /> Images</div>
      <div className="hx-bid-controls">
        <button className="hx-bid-logo-btn" onClick={() => fileRef.current?.click()}>
          <Upload size={13} /> Attach
        </button>
        <button className="hx-bid-logo-btn" onClick={() => setMode("ai")}>
          <Sparkles size={13} /> AI Generate
        </button>
        <button className="hx-bid-logo-btn" onClick={loadGallery}>
          <ImageIcon size={13} /> From Gallery
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }} />

      {mode === "ai" && (
        <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)" }}>
          <input className="hx-scraper-input" placeholder="Describe the image (ultra realistic…)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="hx-bid-controls">
            <button className="gold-button" style={{ justifyContent: "center" }} onClick={generate} disabled={loading}>
              {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Generate
            </button>
            <button className="hx-bid-logo-btn" onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}

      {mode === "gallery" && (
        <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 12, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel)", maxHeight: 280, overflowY: "auto" }}>
          {gallery.length === 0 ? <span style={{ fontSize: 11, color: "#707070" }}>No images found. Add floor systems or projects first.</span> :
            gallery.map((g, i) => (
              <button key={i} className="hx-sys-card" style={{ cursor: "pointer", textAlign: "left", padding: 8 }} onClick={() => { setImages((arr) => [...arr, { url: g.url, caption: g.caption }]); setMode(null); notify && notify("Image added"); }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img src={g.url} alt="" style={{ width: 56, height: 42, borderRadius: 8, objectFit: "cover" }} />
                  <span style={{ fontSize: 11, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.caption}</span>
                  <Plus size={14} style={{ color: "var(--vx-accent)", marginLeft: "auto" }} />
                </div>
              </button>
            ))}
          <button className="hx-bid-logo-btn" onClick={() => setMode(null)}>Close</button>
        </div>
      )}

      {images.length > 0 && (
        <div className="hx-bid-photo-grid">
          {images.map((img, i) => (
            <div key={i} className="hx-bid-photo-tile">
              <img src={img.url} alt={img.caption || ""} />
              <button className="hx-bid-photo-remove" onClick={() => setImages((arr) => arr.filter((_, x) => x !== i))}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}