import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  ScanLine,
  GitCompare,
  Calculator,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PRICE_DISCLOSURE } from "@/lib/brand";

const HERO_IMG =
  "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png";

const STATUS_MAP = {
  new: { label: "New", cls: "ready" },
  qualified: { label: "Ready to Quote", cls: "ready" },
  estimate_sent: { label: "Estimate Sent", cls: "progress" },
  proposal_sent: { label: "Proposal Sent", cls: "progress" },
  won: { label: "Won", cls: "ready" },
  lost: { label: "Lost", cls: "blocked" },
  follow_up: { label: "Draft", cls: "draft" },
};

export default function Home() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 50)
      .then((l) => setLeads(l))
      .catch(() => setLeads([]));
  }, []);

  const recent = leads.slice(0, 5);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";

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
      </div>

      {/* Recent Projects */}
      <section className="hx-section">
        <div className="hx-section-head">
          <h2>Recent Projects</h2>
          <button onClick={() => navigate("/leads")}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="hx-project-list">
          {recent.length === 0 ? (
            <div className="hx-empty">
              <div>
                <span>0</span>
                No recent bids yet. Start a new visualization to see them here.
              </div>
            </div>
          ) : (
            recent.map((l) => {
              const badge = STATUS_MAP[l.status] || { label: l.status, cls: "ready" };
              return (
                <button
                  key={l.id}
                  className="hx-project-row"
                  onClick={() => navigate(`/leads/${l.id}`)}
                >
                  <div className="hx-project-thumb">
                    {l.photo_url ? (
                      <img src={l.photo_url} alt="" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </div>
                  <div className="hx-project-info">
                    <strong>{l.customer_name || "Untitled Project"}</strong>
                    <small>{l.project_address || "No address"}</small>
                    <small className="hx-sqft">
                      {l.square_feet ? `${l.square_feet.toLocaleString()} sq ft` : "—"}
                    </small>
                  </div>
                  <div className="hx-project-side">
                    <span className={`vx-chip ${badge.cls}`}>{badge.label}</span>
                    <time>{fmtDate(l.created_date)}</time>
                  </div>
                  <ChevronRight size={16} className="hx-project-arrow" />
                </button>
              );
            })
          )}
        </div>
      </section>

      <p className="hx-disclosure">{PRICE_DISCLOSURE}</p>
    </div>
  );
}