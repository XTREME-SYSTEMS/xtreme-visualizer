import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, ShieldCheck, Settings, FileText, Calculator, Users, Palette,
  Package, Mail, Target, BookOpen, TrendingUp, CalendarClock, ScrollText,
  Camera, Sparkles,
} from "lucide-react";

const SURFACES = [
  { to: "/visualizer", label: "Visualizer", icon: Camera },
  { to: "/systems", label: "Floor Systems", icon: Briefcase },
  { to: "/pricing", label: "Pricing Rules", icon: Calculator },
  { to: "/close", label: "Proposal Studio", icon: FileText },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/colors", label: "Color Charts", icon: Palette },
  { to: "/email-templates", label: "Email Templates", icon: Mail },
  { to: "/lead-generator", label: "Lead Generator", icon: Target },
  { to: "/bid-generator", label: "Bid Generator", icon: Sparkles },
  { to: "/competitive-pricing", label: "Market Pricing", icon: TrendingUp },
  { to: "/industry", label: "Industry Reference", icon: BookOpen },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
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
      <div className="hx-more-grid">
        {SURFACES.map(({ to, label, icon: Icon }) => (
          <button key={to} className="hx-more-card" onClick={() => navigate(to)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}