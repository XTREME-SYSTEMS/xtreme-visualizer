import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Inbox as InboxIcon, ShieldCheck, Settings, FileText, Calculator, Users, Palette, Package, Mail, Target, BookOpen, TrendingUp, CalendarClock, ScrollText } from "lucide-react";

const SURFACES = [
  { to: "/visualizer", label: "Vizualizer", icon: Briefcase },
  { to: "/systems", label: "Floor Systems", icon: Briefcase },
  { to: "/pricing", label: "Pricing Rules", icon: Calculator },
  { to: "/close", label: "Proposal Studio", icon: FileText },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/colors", label: "Color Charts", icon: Palette },
  { to: "/email-templates", label: "Email Templates", icon: Mail },
  { to: "/lead-generator", label: "Lead Generator", icon: Target },
  { to: "/bid-generator", label: "Bid Generator", icon: FileText },
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
    <>
      <div className="content-header">
        <div>
          <h1>System & Guardrails</h1>
          <p>Brand controls, backend health, and protected AI boundaries.</p>
        </div>
      </div>
      <div className="content-card">
        <h2 className="section-title" style={{ fontSize: 20 }}>Backend connection</h2>
        <div className="status-card" style={{ marginTop: 15 }}>
          <div className="status-line">
            <span>Base44 API</span>
            <strong className="online">Connected</strong>
          </div>
          <div className="status-line">
            <span>Endpoint</span>
            <code>base44/entities</code>
          </div>
          <div className="status-line">
            <span>Storage</span>
            <strong>Cloud DB + receipts</strong>
          </div>
        </div>

        <h2 className="section-title" style={{ fontSize: 20, marginTop: 25 }}>Vizzy guardrails</h2>
        <div className="guardrail" style={{ marginTop: 14 }}>
          Vizzy may explain systems, guide photo capture, compare finishes, summarize scope, and draft communications. Vizzy must never state a final price, completion date, warranty, engineering suitability, or code compliance. All pricing remains preliminary and subject to contractor site verification.
        </div>

        <h2 className="section-title" style={{ fontSize: 20, marginTop: 25 }}>Backend surfaces</h2>
        <div className="sheet-list" style={{ marginTop: 12 }}>
          {SURFACES.map(({ to, label, icon: Icon }) => (
            <button key={to} className="sheet-item" onClick={() => navigate(to)}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}