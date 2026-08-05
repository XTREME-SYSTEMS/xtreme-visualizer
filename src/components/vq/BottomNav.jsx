import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, Briefcase, Users, MessageSquare, MoreHorizontal } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/inbox", label: "Inbox", icon: MessageSquare },
  { to: "/more", label: "More", icon: MoreHorizontal },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((t) => (t.to === "/" ? pathname === "/" : pathname.startsWith(t.to)));
  return (
    <nav className="bottom-nav" style={{ paddingLeft: "var(--safe-area-left)", paddingRight: "var(--safe-area-right)" }}>
      {TABS.map(({ to, label, icon: Icon }) => {
        const isActive = active?.to === to;
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}