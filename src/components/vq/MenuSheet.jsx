import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Briefcase, Users, Inbox as InboxIcon, Settings, X } from "lucide-react";
import RefLogo from "@/components/vq/RefLogo";

const ITEMS = [
  { to: "/visualizer", label: "Vizualizer", icon: Sparkles },
  { to: "/projects", label: "Projects & Proposals", icon: Briefcase },
  { to: "/leads", label: "CRM Pipeline", icon: Users },
  { to: "/inbox", label: "Customer Inbox", icon: InboxIcon },
  { to: "/more", label: "Settings & Guardrails", icon: Settings },
];

export default function MenuSheet({ onClose }) {
  const navigate = useNavigate();
  const go = (to) => {
    navigate(to);
    onClose();
  };
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <aside className="sheet">
        <div className="sheet-head">
          <RefLogo onClick={onClose} />
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={21} />
          </button>
        </div>
        <div className="sheet-list">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <button key={to} className="sheet-item" onClick={() => go(to)}>
              <Icon size={21} /> {label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}