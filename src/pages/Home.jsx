import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  Users,
  Ruler,
  DollarSign,
  MessageSquare,
  FileText,
  Package,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { PRICE_DISCLOSURE } from "@/lib/brand";
import { getHeroImage, getHeroFilters, heroFilterString } from "@/components/settings/HeroImagePicker";

const YELLOW = "#FFD700";
const BLACK = "#000000";
const GREY = "#A9A9A9";
const BORDER = "#E5E5E5";

const WORKFLOW_CARDS = [
  { icon: Users, label: "Find & Qualify Leads", badge: "4 new", route: "/leads" },
  { icon: Ruler, label: "Takeoffs & Measurements", badge: "3 ready", route: "/visualizer" },
  { icon: DollarSign, label: "Estimates & Pricing", badge: null, route: "/pricing" },
  { icon: MessageSquare, label: "Customer Chat", badge: null, route: "/inbox" },
  { icon: FileText, label: "Proposals & Contracts", badge: null, route: "/close" },
  { icon: Package, label: "Materials & Orders", badge: null, route: "/operations" },
];

function WorkflowCard({ card, navigate }) {
  const Icon = card.icon;
  return (
    <button
      onClick={() => navigate(card.route)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        padding: 16,
        background: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F5F5",
          borderRadius: 10,
        }}
      >
        <Icon size={20} color={BLACK} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <strong style={{ fontSize: 14, color: BLACK }}>{card.label}</strong>
        {card.badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#B8860B",
              background: "#FFF8DC",
              padding: "2px 8px",
              borderRadius: 8,
            }}
          >
            {card.badge}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ fontSize: 12, color: GREY }}>Guided workflow</span>
        <ChevronRight size={16} color={GREY} />
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const HERO_IMG = getHeroImage();
  const heroFilters = getHeroFilters();

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#FFFFFF",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        position: "relative",
      }}
    >
      {/* Hero */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        <img
          src={HERO_IMG}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: heroFilterString(heroFilters) }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.1, letterSpacing: -0.5 }}>
            Turn Floors Into Profits.
          </h1>
          <p style={{ fontSize: 14, color: "#FFFFFF", margin: 0, opacity: 0.9 }}>
            Faster takeoffs. Accurate estimates. More jobs.
          </p>
          <button
            onClick={() => navigate("/visualizer")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              background: YELLOW,
              color: BLACK,
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            <Plus size={18} /> Start New Estimate <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Job Workflow */}
      <div style={{ padding: "24px 20px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: BLACK, margin: 0 }}>Job Workflow</h2>
          <span style={{ fontSize: 13, color: GREY }}>From lead to finished floor.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {WORKFLOW_CARDS.map((card) => (
            <WorkflowCard key={card.label} card={card} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Business Tools */}
      <div style={{ padding: "12px 20px" }}>
        <button
          onClick={() => navigate("/more")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 16,
            width: "100%",
            background: "#FFFFFF",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F5F5F5",
              borderRadius: 10,
            }}
          >
            <Briefcase size={20} color={BLACK} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 15, color: BLACK, display: "block" }}>Business Tools</strong>
            <span style={{ fontSize: 12, color: GREY }}>Marketing, communications, projects and more.</span>
          </div>
          <ChevronRight size={20} color={GREY} />
        </button>
      </div>

      {/* Ask Xtreme AI */}
      <div style={{ padding: "0 20px 24px" }}>
        <button
          onClick={() => navigate("/vizzy")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 18,
            width: "100%",
            background: "#202020",
            border: "none",
            borderRadius: 14,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Sparkles size={24} color="#FFFFFF" />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 15, color: "#FFFFFF", display: "block" }}>Ask Xtreme AI</strong>
            <span style={{ fontSize: 12, color: GREY }}>Get answers, ideas and next steps.</span>
          </div>
          <ChevronRight size={20} color="#FFFFFF" />
        </button>
      </div>

      <p style={{ padding: "0 20px 24px", fontSize: 11, color: GREY, textAlign: "center", margin: 0 }}>
        {PRICE_DISCLOSURE}
      </p>
    </div>
  );
}