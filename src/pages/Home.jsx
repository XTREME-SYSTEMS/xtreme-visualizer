import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, ScanLine, GitCompare, Calculator, Share2, Layers, Images, Palette, Sparkles } from "lucide-react";
import { PRICE_DISCLOSURE } from "@/lib/brand";

const HERO_IMG =
  "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-full hx-home">
      {/* Hero */}
      <div className="hx-hero">
        <img src={HERO_IMG} alt="" className="hx-hero-img" />
        <div className="hx-hero-sweep" />
        <div className="hx-hero-content">
          <h1>
            Visualize Floors.
            <br />
            <span>Close Jobs Faster.</span>
          </h1>
          <p>Stunning floor previews. Accurate quotes. More wins.</p>
        </div>
        <button className="hx-hero-btn" onClick={() => navigate("/visualizer")}>
          <Plus size={18} />
          <span>New Visualization</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="hx-quick-grid">
        <button className="hx-quick-card" onClick={() => navigate("/visualizer")}>
          <ScanLine size={22} />
          <span>Scan Space</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/visualizer")}>
          <GitCompare size={22} />
          <span>Compare Finishes</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/pricing")}>
          <Calculator size={22} />
          <span>Quote Range</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/close")}>
          <Share2 size={22} />
          <span>Share Proposal</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/systems")}>
          <Layers size={22} />
          <span>Floor Systems</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/gallery")}>
          <Images size={22} />
          <span>Gallery</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/colors")}>
          <Palette size={22} />
          <span>Color Charts</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/bid-generator")}>
          <Sparkles size={22} />
          <span>Bid Generator</span>
        </button>
      </div>

      <p className="hx-disclosure" style={{ marginTop: "auto" }}>{PRICE_DISCLOSURE}</p>
    </div>
  );
}