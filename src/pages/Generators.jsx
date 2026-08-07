import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Wand2, Image, Film, CreditCard, BookOpen, Share2, Mail, FileText, Package, Globe, Smartphone } from "lucide-react";

const GENERATORS = [
  { icon: Wand2, label: "Logo Generator", desc: "AI-generated logo concepts", route: "/business-generator" },
  { icon: Image, label: "Image Generator", desc: "Ultra life-like coating photos", route: "/gallery" },
  { icon: Film, label: "Video Generator", desc: "AI-powered promotional videos", route: "/video-studio" },
  { icon: CreditCard, label: "Digital Business Card", desc: "Branded contact card with QR", route: "/crm" },
  { icon: BookOpen, label: "Digital Brochure", desc: "Print-ready marketing brochure", route: "/business-generator" },
  { icon: Share2, label: "Social Media Post", desc: "Captions, hashtags & video scripts", route: "/business-generator" },
  { icon: Mail, label: "Email Template", desc: "Cold outreach & follow-up emails", route: "/email-templates" },
  { icon: FileText, label: "Proposal Generator", desc: "Sales proposals & packages", route: "/close" },
  { icon: Package, label: "Bid Package", desc: "Job bids & estimates", route: "/bid-generator" },
  { icon: Globe, label: "Website Generator", desc: "PWA homepage concepts", route: "/business-generator" },
  { icon: Smartphone, label: "App Generator", desc: "Mobile app concepts & features", route: "/business-generator" },
];

export default function Generators() {
  const navigate = useNavigate();

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Creative Hub</h1>
          <p>{GENERATORS.length} AI-powered tools to build your brand & marketing</p>
        </div>
      </div>

      <div className="hx-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GENERATORS.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.label}
              className="hx-portal-card"
              onClick={() => navigate(g.route)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}
            >
              <div className="hx-portal-icon" style={{ background: "var(--vx-accent-soft)", border: "1px solid #8A7300", color: "var(--vx-accent)" }}>
                <Icon size={20} />
              </div>
              <div className="hx-portal-text" style={{ flex: 1, textAlign: "left" }}>
                <strong>{g.label}</strong>
                <span style={{ display: "block", fontSize: 12, color: "var(--vx-muted)" }}>{g.desc}</span>
              </div>
              <ChevronRight size={16} className="hx-portal-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}