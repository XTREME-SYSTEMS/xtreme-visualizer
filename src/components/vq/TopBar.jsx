import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ArrowLeft, Menu } from "lucide-react";
import RefLogo from "@/components/vq/RefLogo";
import { useUI } from "@/lib/uiContext";

const PAGE_TITLES = {
  projects: "Projects",
  visualizer: "Vizualizer",
  leads: "Lead Pipeline",
  inbox: "Inbox",
  more: "System & Guardrails",
  systems: "Floor Systems",
  pricing: "Pricing Rules",
  products: "Products",
  colors: "Color Charts",
  generator: "Image Generator",
  appointments: "Appointments",
  receipts: "Receipts",
  guardrails: "Guardrails",
  close: "Close",
  "competitive-pricing": "Competitive Pricing",
  industry: "Industry Reference",
  "lead-generator": "Lead Generator",
  crm: "CRM",
  "email-templates": "Email Templates",
  "bid-generator": "Bid Generator",
  settings: "Settings",
};

function deriveTitle(pathname) {
  if (pathname.match(/^\/leads\/[^/]+$/)) return "Lead Detail";
  const seg = pathname.split("/").filter(Boolean)[0] || "";
  return PAGE_TITLES[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
}

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toggleSearch, openMenu } = useUI();
  const isHome = pathname === "/";
  const showBack = !isHome && !["/projects", "/leads", "/inbox", "/more"].includes(pathname);

  return (
    <header className="topbar">
      {showBack ? (
        <button onClick={() => navigate(-1)} aria-label="Back" className="icon-button">
          <ArrowLeft size={24} />
        </button>
      ) : (
        <RefLogo />
      )}
      {showBack && (
        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#000", letterSpacing: "-.02em" }}>
            {deriveTitle(pathname)}
          </span>
        </div>
      )}
      <div className="top-actions">
        <button onClick={toggleSearch} aria-label="Search" className="icon-button">
          <Search size={22} />
        </button>
        <button aria-label="Notifications" className="icon-button">
          <Bell size={25} />
          <span className="badge-count">2</span>
        </button>
        <button onClick={openMenu} aria-label="Menu" className="icon-button">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}