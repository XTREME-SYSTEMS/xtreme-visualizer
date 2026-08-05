import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Palette,
  Layers,
  Calculator,
  Mail,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";
import { money as moneyFmt } from "@/lib/pricing";
import { PRICE_DISCLOSURE } from "@/lib/brand";

export default function Home() {
  const navigate = useNavigate();
  const { query } = useUI();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 50)
      .then((l) => setLeads(l))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();

  const recentBids = useMemo(() => {
    const filtered = q
      ? leads.filter((l) =>
          [l.customer_name, l.system_name, l.project_address, l.color_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : leads;
    return filtered.slice(0, 5);
  }, [leads, q]);

  const stats = useMemo(() => {
    const count = (status) => leads.filter((l) => l.status === status).length;
    return {
      new: count("new"),
      qualified: count("qualified"),
      won: count("won"),
      total: leads.length,
    };
  }, [leads]);

  const buildBidText = (l) => {
    const low = l.estimate_low || 0;
    const high = l.estimate_high || 0;
    return (
      "VISUAL-X PRELIMINARY BID\n" +
      "Project: " + (l.customer_name || "Untitled") + "\n" +
      "System: " + (l.system_name || "—") + "\n" +
      "Color: " + (l.color_name || "Standard") + "\n" +
      "Square feet: " + (l.square_feet || "—") + "\n" +
      "Condition: " + (l.condition || "—") + "\n\n" +
      "Estimated range: " + moneyFmt(low) + " – " + moneyFmt(high) + "\n\n" +
      "This is a preliminary, non-binding range. Final pricing requires onsite verification. Valid for 30 days."
    );
  };

  const shareEmail = (l) =>
    "mailto:?subject=" + encodeURIComponent("Preliminary bid — " + (l.system_name || "floor") + " (" + (l.square_feet || 0) + " sq ft)") +
    "&body=" + encodeURIComponent(buildBidText(l));
  const shareSms = (l) => "sms:?&body=" + encodeURIComponent(buildBidText(l));

  return (
    <div className="home-full">
      {/* Hero */}
      <div className="home-hero">
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
          <Camera size={32} />
        </span>
        <span className="home-cta-text">
          <strong>Start New Bid</strong>
          <small>Take a photo, pick a color, adjust for blemishes, and share an instant estimate.</small>
        </span>
        <ChevronRight size={24} className="home-cta-arrow" />
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

      {/* Recent bids */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>
            <Clock size={16} /> Recent bids
          </h2>
          {leads.length > 5 && (
            <button className="text-link" onClick={() => navigate("/leads")}>
              View all <ChevronRight size={14} />
            </button>
          )}
        </div>
        {loading ? (
          <div className="empty">Loading recent bids…</div>
        ) : recentBids.length === 0 ? (
          <div className="empty">
            No bids yet. Tap <strong>Start New Bid</strong> to create your first estimate.
          </div>
        ) : (
          <div className="home-bid-list">
            {recentBids.map((l) => (
              <div key={l.id} className="home-bid-row">
                <button className="home-bid-main" onClick={() => navigate("/leads/" + l.id)}>
                  <span className="home-bid-thumb">
                    {l.photo_url ? (
                      <img src={l.photo_url} alt="" />
                    ) : (
                      <Layers size={20} />
                    )}
                  </span>
                  <span className="home-bid-info">
                    <strong>{l.customer_name || "Untitled"}</strong>
                    <small>
                      {l.system_name || "—"} · {l.square_feet ? l.square_feet.toLocaleString() + " sq ft" : "—"}
                    </small>
                    <span className="home-bid-range">
                      {moneyFmt(l.estimate_low)} – {moneyFmt(l.estimate_high)}
                    </span>
                  </span>
                </button>
                <span className="home-bid-actions">
                  <a className="home-bid-share" href={shareEmail(l)} title="Email bid">
                    <Mail size={16} />
                  </a>
                  <a className="home-bid-share" href={shareSms(l)} title="SMS bid">
                    <MessageSquare size={16} />
                  </a>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick reference */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>Quick reference</h2>
        </div>
        <div className="home-ref-grid">
          <button className="home-ref-card" onClick={() => navigate("/colors")}>
            <span className="home-ref-icon">
              <Palette size={24} />
            </span>
            <strong>Color Charts</strong>
            <small>Manufacturer swatches</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/systems")}>
            <span className="home-ref-icon">
              <Layers size={24} />
            </span>
            <strong>Floor Systems</strong>
            <small>System catalog & rates</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/pricing")}>
            <span className="home-ref-icon">
              <Calculator size={24} />
            </span>
            <strong>Pricing</strong>
            <small>Rate profiles</small>
          </button>
          <button className="home-ref-card" onClick={() => navigate("/competitive-pricing")}>
            <span className="home-ref-icon">
              <TrendingUp size={24} />
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