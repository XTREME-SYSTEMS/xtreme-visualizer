import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, ShieldCheck, Settings, FileText, Calculator, Users, Palette,
  Package, Mail, Target, BookOpen, TrendingUp, CalendarClock, ScrollText,
  Camera, Sparkles, ChevronRight, LayoutDashboard, BarChart3, CreditCard,
  ClipboardList, Image, Film,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const ALL_SURFACES = [
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
  { to: "/video-studio", label: "Video Studio", icon: Film },
  { to: "/competitive-pricing", label: "Market Pricing", icon: TrendingUp },
  { to: "/industry", label: "Industry Reference", icon: BookOpen },
  { to: "/appointments", label: "Schedule", icon: CalendarClock },
  { to: "/receipts", label: "Activity Receipts", icon: ScrollText },
  { to: "/guardrails", label: "Guardrails", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

// #23: Role-based surface filtering
const CREW_SURFACES = [
  { to: "/operations", label: "Operations Hub", icon: ClipboardList },
  { to: "/field", label: "Field Dashboard", icon: Camera },
  { to: "/gallery", label: "Gallery", icon: Image },
  { to: "/appointments", label: "Schedule", icon: CalendarClock },
  { to: "/settings", label: "Settings", icon: Settings },
];

const SALES_SURFACES = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/visualizer", label: "Visualizer", icon: Camera },
  { to: "/close", label: "Proposal Studio", icon: FileText },
  { to: "/crm", label: "Digital Card Studio", icon: CreditCard },
  { to: "/lead-generator", label: "Lead Generator", icon: Target },
  { to: "/bid-generator", label: "Bid Generator", icon: Sparkles },
  { to: "/video-studio", label: "Video Studio", icon: Film },
  { to: "/appointments", label: "Schedule", icon: CalendarClock },
  { to: "/gallery", label: "Gallery", icon: Image },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function More() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const role = user?.role || "admin";
  const surfaces = role === "crew" ? CREW_SURFACES : role === "sales" ? SALES_SURFACES : ALL_SURFACES;

  return (
    <div className="page hx-page hx-more">
      <div className="hx-page-head">
        <div>
          <h1>All Screens</h1>
          <p>Every tool and surface in your workspace.</p>
        </div>
      </div>
      <div className="hx-more-list">
        {surfaces.map(({ to, label, icon: Icon }) => (
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