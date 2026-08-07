import React, { useState, useEffect, useCallback } from "react";
import { Camera, X, Sparkles, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { GALLERY_CATEGORIES as CATEGORIES } from "@/data/galleryImages";
import GalleryImageGenerator from "@/components/gallery/GalleryImageGenerator";

function CategorySection({ category, onImageClick }) {
  return (
    <div className="hx-sys-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, background: "var(--vx-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vx-accent)" }}>
          <Camera size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ display: "block", fontSize: 15 }}>{category.title}</strong>
          <span style={{ fontSize: 11, color: "var(--vx-muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{category.description}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vx-accent)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--vx-accent)" }}>{category.images.length}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {category.images.map((img, i) => (
          <button
            key={i}
            onClick={() => onImageClick(category, i)}
            style={{ aspectRatio: "4 / 3", cursor: "pointer", border: "1px solid var(--vx-border-soft)", padding: 0, borderRadius: 10, overflow: "hidden", position: "relative", background: "var(--vx-panel-2)" }}
          >
            <Image src={img} alt={`${category.title} ${i + 1}`} fittingType="fill" className="w-full h-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

function GeneratedSection({ images, onImageClick, onDelete }) {
  return (
    <div className="hx-sys-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, borderColor: "#8A7300" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, background: "var(--vx-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vx-accent)", border: "1px solid #8A7300" }}>
          <Sparkles size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ display: "block", fontSize: 15 }}>My Generated Images</strong>
          <span style={{ fontSize: 11, color: "var(--vx-muted)" }}>AI-generated coating photos you created</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vx-accent)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--vx-accent)" }}>{images.length}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {images.map((img, i) => (
          <div key={img.id || i} style={{ aspectRatio: "4 / 3", position: "relative", border: "1px solid var(--vx-border-soft)", borderRadius: 10, overflow: "hidden", background: "var(--vx-panel-2)" }}>
            <button onClick={() => onImageClick(img, i)} style={{ width: "100%", height: "100%", cursor: "pointer", border: "none", padding: 0, background: "none" }}>
              <Image src={img.image_url} alt={img.title || "Generated"} fittingType="fill" className="w-full h-full" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
              style={{ position: "absolute", top: 4, right: 4, width: 26, height: 26, borderRadius: 6, border: "none", background: "rgba(0,0,0,.65)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [active, setActive] = useState(null);
  const [generated, setGenerated] = useState([]);

  const loadGenerated = useCallback(async () => {
    try {
      const list = await base44.entities.GalleryImage.list("-created_date", 50);
      setGenerated(list || []);
    } catch (e) {
      setGenerated([]);
    }
  }, []);

  useEffect(() => {
    loadGenerated();
  }, [loadGenerated]);

  const nextImage = () => {
    if (!active) return;
    const next = (active.index + 1) % active.category.images.length;
    setActive({ ...active, index: next });
  };
  const prevImage = () => {
    if (!active) return;
    const prev = (active.index - 1 + active.category.images.length) % active.category.images.length;
    setActive({ ...active, index: prev });
  };

  const handleDeleteGenerated = async (id) => {
    try {
      await base44.entities.GalleryImage.delete(id);
      setGenerated((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {}
  };

  return (
    <div className="page hx-page hx-gallery-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Surface Coating Gallery</h1>
          <p>{CATEGORIES.length} coating types · {CATEGORIES.reduce((s, c) => s + c.images.length, 0) + generated.length} project photos</p>
        </div>
      </div>

      <GalleryImageGenerator onGenerated={loadGenerated} />

      {generated.length > 0 && (
        <GeneratedSection
          images={generated}
          onImageClick={(img) => setActive({ category: { title: img.title || "Generated", description: img.prompt, images: [img.image_url] }, index: 0 })}
          onDelete={handleDeleteGenerated}
        />
      )}

      <div className="hx-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.id} category={cat} onImageClick={(category, index) => setActive({ category, index })} />
        ))}
      </div>

      {active && (
        <div className="overlay" onClick={() => setActive(null)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: "100%", background: "var(--vx-panel)", borderRadius: "var(--vx-radius)", overflow: "hidden", border: "1px solid var(--vx-border-soft)" }}>
            <div style={{ aspectRatio: "4 / 3", position: "relative" }}>
              <Image src={active.category.images[active.index]} alt={active.category.title} fittingType="fill" className="w-full h-full" />
              <button onClick={() => setActive(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: 6, color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
              {active.category.images.length > 1 && (
                <>
                  <button onClick={prevImage} style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>‹</button>
                  <button onClick={nextImage} style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>›</button>
                </>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{active.category.title}</h2>
              <p style={{ fontSize: 13, color: "var(--vx-muted)", margin: 0, lineHeight: 1.5 }}>{active.category.description}</p>
              {active.category.images.length > 1 && (
                <span style={{ display: "block", marginTop: 8, fontSize: 11, color: "var(--vx-faint)" }}>{active.index + 1} of {active.category.images.length}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}