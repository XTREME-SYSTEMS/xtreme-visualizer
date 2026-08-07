import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  ScanLine,
  LayoutDashboard,
  Phone,
  Wand2,
  Image,
  Layers,
  ClipboardList,
  Globe,
  Calendar,
  CreditCard,
} from "lucide-react";
import { PRICE_DISCLOSURE } from "@/lib/brand";
import { getHeroImage, getHeroFilters, heroFilterString } from "@/components/settings/HeroImagePicker";
import { getHeroTextConfig, fontStack } from "@/components/settings/HeroTextCustomizer";

export default function Home() {
  const navigate = useNavigate();
  const HERO_IMG = getHeroImage();
  const heroFilters = getHeroFilters();
  const heroText = getHeroTextConfig();
  const heroFont = fontStack(heroText.fontFamily);

  return (
    <div className="home-full hx-home">
      {/* Hero */}
      <div className="hx-hero">
        <img src={HERO_IMG} alt="" className="hx-hero-img" style={{ filter: heroFilterString(heroFilters) }} />
        <div className="hx-hero-sweep" />
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: heroFilters.darken / 100, pointerEvents: "none" }} />
        <div className="hx-hero-content" style={{ fontFamily: heroFont }}>
          <h1 style={{ fontFamily: heroFont, color: heroText.headingColor || undefined }}>
            {heroText.headingLine1}
            <br />
            <span style={{ color: heroText.headingColor || undefined }}>{heroText.headingLine2}</span>
          </h1>
          <p style={{ fontFamily: heroFont, color: heroText.subheadingColor || undefined }}>{heroText.subheading}</p>
        </div>
        <button className="hx-hero-btn" onClick={() => navigate("/visualizer")} style={{ fontFamily: heroFont, color: heroText.buttonColor || undefined }}>
          <Plus size={18} />
          <span>{heroText.buttonLabel}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="hx-quick-grid">
        <button className="hx-quick-card" onClick={() => navigate("/visualizer")}>
          <ScanLine size={22} />
          <span>Visualizer</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/dashboard")}>
          <LayoutDashboard size={22} />
          <span>Dashboard</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/voice")}>
          <Phone size={22} />
          <span>Voice AI</span>
        </button>
        <button className="hx-quick-card" onClick={() => navigate("/business-generator")}>
          <Wand2 size={22} />
          <span>Business Generator</span>
        </button>
      </div>

      {/* Tools */}
      <section className="hx-portal">
        <div className="hx-section-head">
          <h2>Tools</h2>
        </div>
        <div className="hx-portal-grid">
          <button className="hx-portal-card" onClick={() => navigate("/gallery")}>
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
          <button className="hx-portal-card" onClick={() => navigate("/operations")}>
            <div className="hx-portal-icon"><ClipboardList size={20} /></div>
            <div className="hx-portal-text">
              <strong>Operations</strong>
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
          <button className="hx-portal-card" onClick={() => navigate("/generators")}>
            <div className="hx-portal-icon"><Wand2 size={20} /></div>
            <div className="hx-portal-text">
              <strong>Generators</strong>
            </div>
            <ChevronRight size={16} className="hx-portal-arrow" />
          </button>
        </div>
      </section>

      <p className="hx-disclosure">{PRICE_DISCLOSURE}</p>
    </div>
  );
}