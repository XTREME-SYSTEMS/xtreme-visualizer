import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, ShieldCheck, Settings, FileText, Calculator, Users, Palette,
  Package, Mail, Target, BookOpen, TrendingUp, CalendarClock, ScrollText,
  Camera, Sparkles, ChevronRight, LayoutDashboard, BarChart3, CreditCard,
} from "lucide-react";

const SURFACES = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tracking", label: "Analytics & Tracking", icon: BarChart3 },
  { to: "/visualizer", label: "Visualizer", icon: Camera },
  { to: "/systems", label: "Floor Systems", icon: Briefcase },
  { to: "/pricing", label: "Pricing Rules", icon: Calculator },
  { to: "/close", label: "Proposal Studio", icon: FileText },
  { to: "/crm", label: "Digital Card Studio", icon: CreditCard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/colors", label: "Color Charts", icon: Palette },
  { to: "/email-templates", label: "Email Templates", icon: Mail },
  { to: "/lead-generator", label: "Lead Generator", icon: Target },
  { to: "/bid-generator", label: "Bid Generator", icon: Sparkles },
  { to: "/competitive-pricing", label: "Market Pricing", icon: TrendingUp },
  { to: "/industry", label: "Industry Reference", icon: BookOpen },
  { to: "/appointments", label: "Schedule", icon: CalendarClock },
  { to: "/receipts", label: "Activity Receipts", icon: ScrollText },
  { to: "/guardrails", label: "Guardrails", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function More() {
  const navigate = useNavigate();
  return (
    <div className="page hx-page hx-more">
      <div className="hx-page-head">
        <div>
          <h1>All Screens</h1>
          <p>Every tool and surface in your workspace.</p>
        </div>
      </div>
      <div className="hx-more-list">
        {SURFACES.map(({ to, label, icon: Icon }) => (
          <button key={to} className="hx-more-row" onClick={() => navigate(to)}>
            <span className="hx-more-icon"><Icon size={20} /></span>
            <span className="hx-more-label">{label}</span>
            <ChevronRight size={18} className="hx-more-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}