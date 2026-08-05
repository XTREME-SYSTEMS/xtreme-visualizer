import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_MASK } from "@/lib/vx";

const VisualXContext = createContext(null);

const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export function VisualXProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("visual-x-theme") || "dark");
  const [session, setSession] = useState(() => ({
    photoUrl: load("vx-photo", ""),
    maskPoints: load("vx-mask", DEFAULT_MASK),
    squareFeet: load("vx-sqft", 0),
    spacePreset: load("vx-space", "garage"),
    systemSlug: load("vx-system", "flake-epoxy"),
    blendCode: load("vx-blend", ""),
    metallicCode: load("vx-metallic", ""),
    selectedCodes: load("vx-selected", []),
    controls: load("vx-controls", { gloss: 68, texture: 42, coverage: 74, opacity: 62 }),
    visualMode: "after",
    compareSelection: "flake",
    leadId: load("vx-lead", ""),
    quoteId: load("vx-quote", ""),
    proposalId: load("vx-proposal", ""),
  }));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("visual-x-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("vx-photo", JSON.stringify(session.photoUrl));
    localStorage.setItem("vx-mask", JSON.stringify(session.maskPoints));
    localStorage.setItem("vx-sqft", JSON.stringify(session.squareFeet));
    localStorage.setItem("vx-space", JSON.stringify(session.spacePreset));
    localStorage.setItem("vx-system", JSON.stringify(session.systemSlug));
    localStorage.setItem("vx-blend", JSON.stringify(session.blendCode));
    localStorage.setItem("vx-metallic", JSON.stringify(session.metallicCode));
    localStorage.setItem("vx-selected", JSON.stringify(session.selectedCodes));
    localStorage.setItem("vx-controls", JSON.stringify(session.controls));
    localStorage.setItem("vx-lead", JSON.stringify(session.leadId));
    localStorage.setItem("vx-quote", JSON.stringify(session.quoteId));
    localStorage.setItem("vx-proposal", JSON.stringify(session.proposalId));
  }, [session]);

  const patch = (values) => setSession((prev) => ({ ...prev, ...values }));

  return (
    <VisualXContext.Provider value={{ theme, setTheme, session, patch }}>
      {children}
    </VisualXContext.Provider>
  );
}

export function useVisualX() {
  const ctx = useContext(VisualXContext);
  if (!ctx) throw new Error("useVisualX must be used inside VisualXProvider");
  return ctx;
}