import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Users,
  FileText,
  Calculator,
  Mail,
  Package,
  Megaphone,
  Calendar,
  Home as HomeIcon,
  BarChart3,
} from "lucide-react";
import { PRICE_DISCLOSURE } from "@/lib/brand";
import { getHeroImage, getHeroFilters, heroFilterString } from "@/components/settings/HeroImagePicker";

const YELLOW = "#FFD700";
const YELLOW_DARK = "#B8860B";
const BLACK = "#000000";
const DARK = "#1A1A1A";
const GREY = "#333333";
const BORDER = "#E5E5E5";

const BADGE_CARDS = [
  { icon: Users, label: "Leads", badge: "4", route: "/leads" },
  { icon: FileText, label: "Takeoffs", badge: "3", route: "/visualizer" },
  { icon: Calculator, label: "Bids", badge: "2", route: "/pricing" },
  { icon: Mail, label: "Inbox", badge: "3", route: "/inbox" },
];

const TOOL_CARDS = [
  { icon: FileText, label: "Contracts", route: "/close" },
  { icon: Package, label: "Materials", route: "/operations" },
  { icon: Megaphone, label: "Marketing", route: "/crm" },
  { icon: Calendar, label: "Schedule", route: "/appointments" },
  { icon: HomeIcon, label: "Projects", route: "/projects" },
  { icon: BarChart3, label: "Business Tools", route: "/more" },
];

function BadgeCard({ card, navigate }) {
  const Icon = card.icon;
  return (
    <button
      onClick={() => navigate(card.route)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "20px 12px",
        background: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: YELLOW,
          color: BLACK,
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {card.badge}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} color={BLACK} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: BLACK }}>{card.label}</span>
    </button>
  );
}

function ToolCard({ card, navigate }) {
  const Icon = card.icon;
  return (
    <button
      onClick={() => navigate(card.route)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: DARK,
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <Icon size={22} color={YELLOW} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>{card.label}</span>
      <ChevronRight size={18} color="#FFFFFF" />
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const HERO_IMG = getHeroImage();
  const heroFilters = getHeroFilters();

  return (
    <div
      className="hx-noscroll"
      style={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#FFFFFF",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        position: "relative",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Hero */}
      <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
        <img
          src={HERO_IMG}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: heroFilterString(heroFilters) }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: -0.5,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Visualize Floors. Close Jobs <span style={{ color: YELLOW }}>Faster.</span>
          </h1>
          <p style={{ fontSize: 15, color: "#FFFFFF", margin: 0, opacity: 0.95 }}>
            Takeoff, price, present, and win.
          </p>
          <button
            onClick={() => navigate("/visualizer")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 24px",
              background: `linear-gradient(135deg, ${YELLOW}, ${YELLOW_DARK})`,
              color: BLACK,
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              width: "fit-content",
              boxShadow: "0 4px 14px rgba(255,215,0,0.3)",
            }}
          >
            Start New Estimate <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Badge Grid */}
      <div style={{ padding: "20px 20px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {BADGE_CARDS.map((card) => (
            <BadgeCard key={card.label} card={card} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Tools */}
      <div style={{ padding: "20px 20px 8px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: BLACK, margin: "0 0 14px" }}>Tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {TOOL_CARDS.map((card) => (
            <ToolCard key={card.label} card={card} navigate={navigate} />
          ))}
        </div>
      </div>

      <p style={{ padding: "16px 20px 24px", fontSize: 11, color: "#999", textAlign: "center", margin: 0 }}>
        {PRICE_DISCLOSURE}
      </p>
    </div>
  );
}