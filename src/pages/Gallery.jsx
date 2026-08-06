import React, { useState } from "react";
import { Camera, X } from "lucide-react";
import { Image } from "@/components/ui/image";

const GALLERY = [
  {
    id: "flake-epoxy",
    title: "Flake Epoxy",
    description: "Decorative vinyl flake broadcast for a textured, slip-resistant finish. Ideal for garages and patios.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/146930828_generated_image.png",
  },
  {
    id: "metallic-epoxy",
    title: "Metallic Epoxy",
    description: "Pearlescent metallic pigments create a swirling, three-dimensional depth. A luxury statement floor.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/dbcf0939d_generated_image.png",
  },
  {
    id: "quartz-epoxy",
    title: "Quartz Epoxy",
    description: "Broadcast quartz aggregate for a durable, anti-slip surface. Built for commercial kitchens and high-traffic areas.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/2e2ec1d13_generated_image.png",
  },
  {
    id: "solid-color-epoxy",
    title: "Solid Color Epoxy",
    description: "A seamless, high-gloss solid color finish. Clean, modern, and easy to maintain.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/73a401e93_generated_image.png",
  },
  {
    id: "glitter-epoxy",
    title: "Glitter Epoxy",
    description: "Sparkling glitter flakes embedded in clear epoxy over a colored base. A dazzling, glamorous finish.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/13c316769_generated_image.png",
  },
  {
    id: "polished-concrete",
    title: "Polished Concrete",
    description: "Mechanically polished to a high sheen with exposed aggregate. Durable, industrial-chic, and low maintenance.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/feaa9f8c7_generated_image.png",
  },
  {
    id: "stained-concrete",
    title: "Stained Concrete",
    description: "Acid-stained concrete with rich, mottled organic tones. Each floor is a one-of-a-kind piece of art.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/54743b85a_generated_image.png",
  },
  {
    id: "epoxy-countertop",
    title: "Epoxy Countertop",
    description: "Seamless epoxy countertops with a marble-look finish. Waterproof, durable, and infinitely customizable.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/047b4b39a_generated_image.png",
  },
  {
    id: "concrete-countertop",
    title: "Concrete Countertop",
    description: "Hand-troweled concrete countertops with natural stone character and integrated sinks. Modern and industrial.",
    image: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/a61e47b5d_generated_image.png",
  },
];

export default function Gallery() {
  const [active, setActive] = useState(null);

  return (
    <div className="page hx-page hx-gallery-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Surface Coating Gallery</h1>
          <p>Explore our finish options — ultra-realistic previews of every system we install.</p>
        </div>
      </div>

      <div className="hx-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {GALLERY.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item)}
            className="hx-gallery-card"
            style={{ aspectRatio: "4 / 3", cursor: "pointer", border: "none", padding: 0, textAlign: "left", borderRadius: "var(--vx-radius)", overflow: "hidden", position: "relative", background: "var(--vx-panel)" }}
          >
            <div className="hx-gallery-img" style={{ position: "absolute", inset: 0 }}>
              <Image src={item.image} alt={item.title} fittingType="fill" className="w-full h-full" />
            </div>
            <div className="hx-gallery-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.1) 55%, transparent 100%)" }} />
            <div className="hx-gallery-content" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div className="hx-gallery-icon" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: "var(--vx-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vx-accent)" }}>
                <Camera size={16} />
              </div>
              <div className="hx-gallery-label" style={{ minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 14, color: "#fff" }}>{item.title}</strong>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.72)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="overlay" onClick={() => setActive(null)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: "100%", background: "var(--vx-panel)", borderRadius: "var(--vx-radius)", overflow: "hidden", border: "1px solid var(--vx-border-soft)" }}>
            <div style={{ aspectRatio: "4 / 3", position: "relative" }}>
              <Image src={active.image} alt={active.title} fittingType="fill" className="w-full h-full" />
              <button onClick={() => setActive(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.6)", border: "none", borderRadius: 8, padding: 6, color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{active.title}</h2>
              <p style={{ fontSize: 13, color: "var(--vx-muted)", margin: 0, lineHeight: 1.5 }}>{active.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}