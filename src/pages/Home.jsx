import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Palette,
  Layers,
  Calculator,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import { PRICE_DISCLOSURE } from "@/lib/brand";

export default function Home() {
  const navigate = useNavigate();
  const { query } = useUI();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 50)
      .then((l) => setLeads(l))
      .catch(() => setLeads([]));
  }, []);

  const stats = useMemo(() => {
    const count = (status) => leads.filter((l) => l.status === status).length;
    return {
      new: count("new"),
      qualified: count("qualified"),
      won: count("won"),
      total: leads.length,
    };
  }, [leads]);

  return (
    <div className="home-full">
      {/* Hero */}
      <div className="home-hero home-hero-large">
        <img
          src="https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div className="home-hero-content">
          <span className="vx-kicker">VISUAL X · COMMAND CENTER</span>
          <h1>
            Design, quote,
            <span>and win floors.</span>
          </h1>
          <p>Scan spaces, visualize finishes, generate quotes, and share proposals — all from one verified workspace.</p>
        </div>
      </div>

      {/* Primary CTA */}
      <button className="home-cta-card" onClick={() => navigate("/visualizer")}>
        <span className="home-cta-icon">
          <Camera size={22} />
        </span>
        <span className="home-cta-text">
          <strong>Start New Bid</strong>
          <small>Take a photo, pick a color, adjust for blemishes, and share an instant estimate.</small>
        </span>
        <ChevronRight size={20} className="home-cta-arrow" />
      </button>

      {/* Pipeline stats */}
      <div className="home-pipeline">
        <div className="home-pipeline-card">
          <strong>{stats.new}</strong>
          <span>New</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.qualified}</strong>
          <span>Qualified</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.won}</strong>
          <span>Won</span>
        </div>
        <div className="home-pipeline-card">
          <strong>{stats.total}</strong>
          <span>Total</span>
        </div>
      </div>

      {/* Quick reference */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>Quick reference</h2>
        </div>
        <div className="home-ref-grid">
          <button className="home-ref-card" onClick={() => navigate("/colors")}>
            <span className="home-ref-icon">
              <Palette size={18} />
            </span>
            <strong>Color Charts</strong>
            <small>Manufacturer swatches</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/systems")}>
            <span className="home-ref-icon">
              <Layers size={18} />
            </span>
            <strong>Floor Systems</strong>
            <small>System catalog & rates</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/pricing")}>
            <span className="home-ref-icon">
              <Calculator size={18} />
            </span>
            <strong>Pricing</strong>
            <small>Rate profiles</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/competitive-pricing")}>
            <span className="home-ref-icon">
              <TrendingUp size={18} />
            </span>
            <strong>Market Intel</strong>
            <small>Competitive rates</small>
          </button>
        </div>
      </section>

      <p className="home-disclosure">{PRICE_DISCLOSURE}</p>
    </div>
  );
}