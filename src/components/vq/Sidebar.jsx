import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Users, Layers, Calculator, ShieldCheck, CalendarClock, ScrollText, Wand2, Package, Palette, FileSignature, Inbox, Settings, TrendingUp, BookOpen, Target, Contact, Mail, FileText, LogOut } from "lucide-react";
import { LogoFull } from "@/components/vq/Logo";

const NAV = [
  { to: "/visualizer", label: "Visualizer", icon: Sparkles },
  { to: "/generator", label: "Image generator", icon: Wand2 },
  { to: "/products", label: "Products", icon: Package },
  { to: "/colors", label: "Color charts", icon: Palette },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/crm", label: "CRM", icon: Contact },
  { to: "/lead-generator", label: "Lead generator", icon: Target },
  { to: "/systems", label: "Floor systems", icon: Layers },
  { to: "/pricing", label: "Pricing rules", icon: Calculator },
  { to: "/competitive-pricing", label: "Market pricing", icon: TrendingUp },
  { to: "/industry", label: "Industry reference", icon: BookOpen },
  { to: "/close", label: "Close", icon: FileSignature },
  { to: "/email-templates", label: "Email templates", icon: Mail },
  { to: "/bid-generator", label: "Bid generator", icon: FileText },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/receipts", label: "Receipts", icon: ScrollText },
  { to: "/guardrails", label: "Guardrails", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-full flex flex-col bg-white border-r border-slate-200 w-full">
      <div className="p-5">
        <LogoFull size={36} />
      </div>
      <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                active ? "bg-[#FFF4CD] text-[#B77A00]" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 space-y-2">
        {user && (
          <div className="rounded-xl border border-slate-200 px-3 py-2 text-[11px]">
            <p className="text-slate-700 font-medium truncate">{user.email}</p>
            <p className="text-slate-400 capitalize">{user.role || "user"}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}