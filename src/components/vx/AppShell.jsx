import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import BottomNav from "@/components/vx/BottomNav";
import { useVisualX } from "@/components/vx/VisualXContext";
import { ROUTE_TITLES } from "@/lib/vx";

export default function AppShell() {
  const location = useLocation();
  const { theme, setTheme } = useVisualX();
  const routeKey = location.pathname.split("/")[2] || "home";
  const title = ROUTE_TITLES[routeKey] || "Settings";

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--vx-bg)" }}>
      <div
        className="mx-auto flex min-h-screen w-full max-w-md flex-col"
        style={{ background: "var(--vx-bg-2)" }}
      >
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur"
          style={{
            borderColor: "var(--vx-border-soft)",
            background: "color-mix(in srgb, var(--vx-bg-2) 88%, transparent)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-xl text-sm font-black text-black"
              style={{ background: "linear-gradient(180deg, var(--vx-accent-2), var(--vx-accent))" }}
            >
              X
            </span>
            <div className="leading-none">
              <strong className="block text-sm tracking-tight" style={{ color: "var(--vx-text)" }}>
                VISUAL X
              </strong>
              <span className="vx-kicker">{title}</span>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-xl border"
            style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-muted)" }}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <main className="vx-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <Outlet />
        </main>

        <BottomNav routeKey={routeKey} />
      </div>
    </div>
  );
}