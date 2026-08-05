import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Ruler,
  Calculator,
  FileText,
  FileSignature,
  Layers,
  Users,
  Package,
  Palette,
  Mail,
  Radar,
  Gavel,
  TrendingUp,
  BookOpen,
  Calendar,
  Receipt,
  Shield,
  Settings,
  Inbox,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useUI } from "@/lib/uiContext";

const NAV_GROUPS = [
  {
    title: "Sell",
    items: [
      { label: "Visualizer", icon: Camera, to: "/visualizer", desc: "Upload & preview finishes" },
      { label: "Projects", icon: Ruler, to: "/projects", desc: "Measure & scope jobs" },
      { label: "Leads", icon: Users, to: "/leads", desc: "Manage pipeline" },
      { label: "Pricing", icon: Calculator, to: "/pricing", desc: "Rates & profiles" },
      { label: "Close", icon: FileText, to: "/close", desc: "Proposals & e-sign" },
      { label: "CRM", icon: FileSignature, to: "/crm", desc: "Customer relationships" },
    ],
  },
  {
    title: "Generate",
    items: [
      { label: "Lead Generator", icon: Radar, to: "/lead-generator", desc: "Find new opportunities" },
      { label: "Bid Generator", icon: Gavel, to: "/bid-generator", desc: "Build competitive bids" },
      { label: "Competitive Pricing", icon: TrendingUp, to: "/competitive-pricing", desc: "Market rate intel" },
      { label: "Appointments", icon: Calendar, to: "/appointments", desc: "Schedule site visits" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Systems", icon: Layers, to: "/systems", desc: "Floor system catalog" },
      { label: "Products", icon: Package, to: "/products", desc: "Materials & SKUs" },
      { label: "Color Charts", icon: Palette, to: "/colors", desc: "Manufacturer swatches" },
      { label: "Industry", icon: BookOpen, to: "/industry", desc: "Trade reference" },
      { label: "Email Templates", icon: Mail, to: "/email-templates", desc: "Saved outreach" },
      { label: "Receipts", icon: Receipt, to: "/receipts", desc: "Activity log" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Inbox", icon: Inbox, to: "/inbox", desc: "Messages" },
      { label: "Guardrails", icon: Shield, to: "/guardrails", desc: "AI safety rules" },
      { label: "Generator", icon: Sparkles, to: "/generator", desc: "AI content tools" },
      { label: "Settings", icon: Settings, to: "/settings", desc: "App configuration" },
      { label: "More", icon: MoreHorizontal, to: "/more", desc: "Additional tools" },
    ],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { query } = useUI();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 50)
      .then((l) => setLeads(l))
      .catch(() => setLeads([]));
  }, []);

  const q = query.trim().toLowerCase();

  return (
    <div className="home-full">
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

      {NAV_GROUPS.map((group) => {
        const items = q
          ? group.items.filter((i) => `${i.label} ${i.desc}`.toLowerCase().includes(q))
          : group.items;
        if (!items.length) return null;
        return (
          <section key={group.title} className="home-nav-section">
            <h2 className="home-nav-title">{group.title}</h2>
            <div className="home-nav-grid">
              {items.map(({ label, icon: Icon, to, desc }) => (
                <button key={label} className="home-nav-card" onClick={() => navigate(to)}>
                  <span className="home-nav-icon">
                    <Icon size={26} />
                  </span>
                  <span className="home-nav-label">
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}