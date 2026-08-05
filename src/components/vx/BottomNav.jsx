import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ScanLine,
  Layers,
  Receipt,
  Settings,
  Columns2,
  Sparkles,
  Send,
  User,
  ListChecks,
} from "lucide-react";

const ICONS = {
  home: Home,
  scan: ScanLine,
  layers: Layers,
  quote: Receipt,
  gear: Settings,
  compare: Columns2,
  wand: Sparkles,
  send: Send,
  user: User,
  tasks: ListChecks,
};

const MAPS = {
  home: [["home", "home", "Home"], ["visualizer", "scan", "Visualize"], ["products", "layers", "Products"], ["quote", "quote", "Quotes"], ["settings", "gear", "Settings"]],
  scan: [["home", "home", "Home"], ["scan", "scan", "Scan"], ["products", "layers", "Systems"], ["quote", "quote", "Quote"], ["settings", "gear", "More"]],
  visualizer: [["home", "home", "Home"], ["visualizer", "scan", "Visualize"], ["products", "layers", "Colors"], ["quote", "quote", "Quote"], ["settings", "gear", "Settings"]],
  compare: [["home", "home", "Home"], ["compare", "compare", "Compare"], ["products", "layers", "Products"], ["proposal", "send", "Share"], ["settings", "gear", "More"]],
  blends: [["home", "home", "Home"], ["blends", "layers", "Blends"], ["visualizer", "scan", "Visualize"], ["quote", "quote", "Quote"], ["settings", "gear", "Settings"]],
  metallic: [["home", "home", "Home"], ["metallic", "wand", "Metallic"], ["visualizer", "scan", "Preview"], ["proposal", "send", "Share"], ["settings", "gear", "More"]],
  products: [["home", "home", "Home"], ["products", "layers", "Products"], ["visualizer", "scan", "Visualize"], ["quote", "quote", "Quote"], ["settings", "gear", "Settings"]],
  quote: [["home", "home", "Home"], ["quote", "quote", "Quote"], ["products", "layers", "Products"], ["proposal", "send", "Share"], ["settings", "gear", "Settings"]],
  proposal: [["home", "home", "Home"], ["proposal", "quote", "Proposal"], ["compare", "send", "Share"], ["lead", "user", "Lead"], ["settings", "gear", "More"]],
  lead: [["home", "home", "Home"], ["lead", "user", "Leads"], ["visualizer", "scan", "Visualize"], ["quote", "tasks", "Tasks"], ["settings", "gear", "Settings"]],
};

export default function BottomNav({ routeKey }) {
  const location = useLocation();
  const items = MAPS[routeKey] || MAPS.home;

  return (
    <nav
      aria-label="Visual X primary navigation"
      className="sticky bottom-0 z-20 grid grid-cols-5 gap-1 border-t px-2 pb-3 pt-2 backdrop-blur"
      style={{
        borderColor: "var(--vx-border-soft)",
        background: "color-mix(in srgb, var(--vx-bg-2) 88%, transparent)",
      }}
    >
      {items.map(([key, iconKey, label]) => {
        const Icon = ICONS[iconKey] || Home;
        const to = key === "settings" ? "/app/settings" : `/app/${key}`;
        const active = location.pathname === to;
        return (
          <Link
            key={`${key}-${label}`}
            to={to}
            className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold uppercase tracking-wide transition"
            style={{
              color: active ? "var(--vx-accent)" : "var(--vx-faint)",
              background: active ? "var(--vx-accent-soft)" : "transparent",
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}