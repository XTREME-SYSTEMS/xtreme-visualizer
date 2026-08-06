import React, { useState } from "react";
import { Camera, X, ChevronDown } from "lucide-react";
import { Image } from "@/components/ui/image";

const CATEGORIES = [
  {
    id: "flake-epoxy",
    title: "Flake Epoxy",
    description: "Decorative vinyl flake broadcast for a textured, slip-resistant finish. Ideal for garages and patios.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f3b1e05b5_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/28bf53920_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/5fd5921f9_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/e1608e566_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/8cb915b79_generated_image.png",
    ],
  },
  {
    id: "metallic-epoxy",
    title: "Metallic Epoxy",
    description: "Pearlescent metallic pigments create a swirling, three-dimensional depth. A luxury statement floor.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/6274d99eb_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/b088a40da_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/6a1c44e3e_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/b6914d4f4_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/ffc94708d_generated_image.png",
    ],
  },
  {
    id: "quartz-epoxy",
    title: "Quartz Epoxy",
    description: "Broadcast quartz aggregate for a durable, anti-slip surface. Built for commercial kitchens and high-traffic areas.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/dba648a54_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/ed0e3ad9d_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/438712f74_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/fff31fbf3_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/6e51ab44c_generated_image.png",
    ],
  },
  {
    id: "solid-color-epoxy",
    title: "Solid Color Epoxy",
    description: "A seamless, high-gloss solid color finish. Clean, modern, and easy to maintain.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/c8ffe55c0_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/9e9b3bb39_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/572c13ce7_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/523ee15c6_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/db75e5588_generated_image.png",
    ],
  },
  {
    id: "glitter-epoxy",
    title: "Glitter Epoxy",
    description: "Sparkling glitter flakes embedded in clear epoxy over a colored base. A dazzling, glamorous finish.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/407f93e20_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/28487b52a_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/cb441cd54_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f865e4ad0_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/0c027fd3f_generated_image.png",
    ],
  },
  {
    id: "polished-concrete",
    title: "Polished Concrete",
    description: "Mechanically polished to a high sheen with exposed aggregate. Durable, industrial-chic, and low maintenance.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/3697fdd6f_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/88028f843_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/63055aee5_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/52db44c43_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f1eb454bf_generated_image.png",
    ],
  },
  {
    id: "stained-concrete",
    title: "Stained Concrete",
    description: "Acid-stained concrete with rich, mottled organic tones. Each floor is a one-of-a-kind piece of art.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/7c4480065_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f6f635fc9_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/302f6728c_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/b5266b5ef_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/62d895dd5_generated_image.png",
    ],
  },
  {
    id: "epoxy-countertop",
    title: "Epoxy Countertop",
    description: "Seamless epoxy countertops with a marble-look finish. Waterproof, durable, and infinitely customizable.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/fa407ed83_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/d75091193_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/b19a984f0_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/67f749cdf_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/2a7e47509_generated_image.png",
    ],
  },
  {
    id: "concrete-countertop",
    title: "Concrete Countertop",
    description: "Hand-troweled concrete countertops with natural stone character and integrated sinks. Modern and industrial.",
    images: [
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f8ea504ab_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/0d96e5149_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/e94fc155a_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/a0009c7e8_generated_image.png",
      "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/bf0b08b5d_generated_image.png",
    ],
  },
];

function CategorySection({ category, onImageClick }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = expanded ? category.images.length : 3;
  const visible = category.images.slice(0, visibleCount);

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
        {visible.map((img, i) => (
          <button
            key={i}
            onClick={() => onImageClick(category, i)}
            style={{ aspectRatio: "4 / 3", cursor: "pointer", border: "1px solid var(--vx-border-soft)", padding: 0, borderRadius: 10, overflow: "hidden", position: "relative", background: "var(--vx-panel-2)" }}
          >
            <Image src={img} alt={`${category.title} ${i + 1}`} fittingType="fill" className="w-full h-full" />
          </button>
        ))}
      </div>

      {category.images.length > 3 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--vx-border-soft)", background: "var(--vx-panel-2)", color: "var(--vx-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          {expanded ? "Show Less" : `Show All ${category.images.length}`}
          <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>
      )}
    </div>
  );
}

export default function Gallery() {
  const [active, setActive] = useState(null);

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

  return (
    <div className="page hx-page hx-gallery-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Surface Coating Gallery</h1>
          <p>{CATEGORIES.length} coating types · {CATEGORIES.reduce((s, c) => s + c.images.length, 0)} project photos</p>
        </div>
      </div>

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
              <button onClick={prevImage} style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>‹</button>
              <button onClick={nextImage} style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <div style={{ padding: 16 }}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{active.category.title}</h2>
              <p style={{ fontSize: 13, color: "var(--vx-muted)", margin: 0, lineHeight: 1.5 }}>{active.category.description}</p>
              <span style={{ display: "block", marginTop: 8, fontSize: 11, color: "var(--vx-faint)" }}>{active.index + 1} of {active.category.images.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}