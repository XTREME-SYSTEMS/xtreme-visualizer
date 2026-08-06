import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import {
  Sparkles,
  Droplets,
  Square,
  Gem,
  Star,
  Palette,
  Disc,
  Layers,
  SquareStack,
  Box,
} from "lucide-react";

const CATEGORIES = [
  {
    name: "Flake Epoxy",
    tagline: "Decorative chip broadcast",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/49909fcd6_generated_image.png",
    Icon: Sparkles,
    group: "Epoxy",
  },
  {
    name: "Metallic Epoxy",
    tagline: "Pearlescent swirl finish",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/4600b61ba_generated_image.png",
    Icon: Droplets,
    group: "Epoxy",
  },
  {
    name: "Solid Color Epoxy",
    tagline: "Uniform seamless coat",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/9f6be3372_generated_image.png",
    Icon: Square,
    group: "Epoxy",
  },
  {
    name: "Quartz Epoxy",
    tagline: "Textured anti-slip surface",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/3eebf2269_generated_image.png",
    Icon: Gem,
    group: "Epoxy",
  },
  {
    name: "Glitter Epoxy",
    tagline: "Sparkling holographic flake",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/2e7969dd7_generated_image.png",
    Icon: Star,
    group: "Epoxy",
  },
  {
    name: "Stained Concrete",
    tagline: "Acid-stained mottled tones",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/db755d81b_generated_image.png",
    Icon: Palette,
    group: "Concrete",
  },
  {
    name: "Polished Concrete",
    tagline: "Mechanically polished gloss",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/327369c05_generated_image.png",
    Icon: Disc,
    group: "Concrete",
  },
  {
    name: "Grind & Seal",
    tagline: "Exposed aggregate clear seal",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/148c4f7fa_generated_image.png",
    Icon: Layers,
    group: "Concrete",
  },
  {
    name: "Epoxy Countertops",
    tagline: "Seamless marble-look surface",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/38fd7663c_generated_image.png",
    Icon: SquareStack,
    group: "Countertops",
  },
  {
    name: "Concrete Countertops",
    tagline: "Cast concrete minimalist",
    img: "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/310444c8f_generated_image.png",
    Icon: Box,
    group: "Countertops",
  },
];

const FILTERS = ["All", "Epoxy", "Concrete", "Countertops"];

export default function ColorCharts() {
  const [filter, setFilter] = useState("All");
  const shown =
    filter === "All" ? CATEGORIES : CATEGORIES.filter((c) => c.group === filter);

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>
            Project <span style={{ color: "var(--vx-accent)" }}>Gallery</span>
          </h1>
          <p>Explore our floor and surface applications by category.</p>
        </div>
      </div>

      <div className="hx-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="hx-gallery-grid">
        {shown.map((c) => (
          <div key={c.name} className="hx-gallery-card">
            <Image
              src={c.img}
              alt={c.name}
              fittingType="fill"
              className="hx-gallery-img"
            />
            <div className="hx-gallery-overlay" />
            <div className="hx-gallery-content">
              <div className="hx-gallery-icon">
                <c.Icon size={16} />
              </div>
              <div className="hx-gallery-label">
                <strong>{c.name}</strong>
                <span>{c.tagline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}