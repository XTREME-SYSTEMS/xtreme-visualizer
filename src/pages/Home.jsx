import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  ScanLine,
  GitCompare,
  Calculator,
  Share2,
  Image,
  Layers,
  FileText,
  Globe,
  Calendar,
  CreditCard,
} from "lucide-react";
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
          <span>Visualizer</span>
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
      </div>

      {/* Tools */}
      <section className="hx-portal">
        <div className="hx-section-head">
          <h2>Tools</h2>
        </div>
        <div className="hx-portal-grid">
          <button className="hx-portal-card" onClick={() => navigate("/colors")}>
            <div className="hx-portal-icon"><Image size={20} /></div>
            <div className="hx-portal-text">
              <strong>Gallery</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
          <button className="hx-portal-card" onClick={() => navigate("/systems")}>
            <div className="hx-portal-icon"><Layers size={20} /></div>
            <div className="hx-portal-text">
              <strong>Floor Systems</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
          <button className="hx-portal-card" onClick={() => navigate("/bid-generator")}>
            <div className="hx-portal-icon"><FileText size={20} /></div>
            <div className="hx-portal-text">
              <strong>Bid Generator</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
          <button className="hx-portal-card" onClick={() => navigate("/lead-generator")}>
            <div className="hx-portal-icon"><Globe size={20} /></div>
            <div className="hx-portal-text">
              <strong>Scraper</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
          <button className="hx-portal-card" onClick={() => navigate("/appointments")}>
            <div className="hx-portal-icon"><Calendar size={20} /></div>
            <div className="hx-portal-text">
              <strong>Schedule</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
          <button className="hx-portal-card" onClick={() => navigate("/crm")}>
            <div className="hx-portal-icon"><CreditCard size={20} /></div>
            <div className="hx-portal-text">
              <strong>Digital Card</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
        </div>
      </section>

      <p className="hx-disclosure">{PRICE_DISCLOSURE}</p>
    </div>
  );
}