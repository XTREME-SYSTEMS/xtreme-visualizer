import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { getPWAButtonConfig } from "@/components/settings/PWAButtonCustomizer";

function buildStyle(cfg) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: cfg.style === "pill" ? "10px 18px" : "10px 12px 10px 16px",
    borderRadius: cfg.style === "pill" ? 999 : 14,
    maxWidth: "calc(100vw - 32px)",
  };
  if (cfg.colorMode === "accent") {
    if (cfg.style === "outline") {
      return { ...base, background: "transparent", color: "var(--vx-accent)", border: "1px solid var(--vx-accent)", boxShadow: "none" };
    }
    if (cfg.style === "solid" || cfg.style === "pill") {
      return { ...base, background: "var(--vx-accent)", color: "#0A0A0A", border: "1px solid var(--vx-accent)", boxShadow: "0 0 24px rgba(255,214,10,.28)" };
    }
    return { ...base, background: "linear-gradient(135deg, var(--vx-accent), var(--vx-accent-2))", color: "#0A0A0A", border: "1px solid var(--vx-accent)", boxShadow: "0 0 24px rgba(255,214,10,.28), 0 8px 24px rgba(0,0,0,.5)" };
  }
  if (cfg.style === "outline") {
    return { ...base, background: "transparent", color: cfg.customFrom, border: `1px solid ${cfg.customFrom}`, boxShadow: "none" };
  }
  if (cfg.style === "solid" || cfg.style === "pill") {
    return { ...base, background: cfg.customFrom, color: "#0A0A0A", border: `1px solid ${cfg.customFrom}`, boxShadow: "0 0 24px rgba(0,0,0,.35)" };
  }
  return { ...base, background: `linear-gradient(135deg, ${cfg.customFrom}, ${cfg.customTo})`, color: "#0A0A0A", border: `1px solid ${cfg.customFrom}`, boxShadow: "0 0 24px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.5)" };
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [cfg, setCfg] = useState(getPWAButtonConfig);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("vx-pwa-install-dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  useEffect(() => {
    const handler = () => { setVisible(false); setDeferredPrompt(null); };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  // Refresh config when the user saves new branding settings
  useEffect(() => {
    const handler = () => setCfg(getPWAButtonConfig());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem("vx-pwa-install-dismissed", "1"); } catch {}
  };

  if (!visible || !deferredPrompt) return null;

  const barStyle = buildStyle(cfg);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        ...barStyle,
      }}
    >
      <button
        onClick={handleInstall}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: 0,
          color: "inherit",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Download size={18} strokeWidth={2.5} />
        <span>{cfg.label || "Install"}</span>
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: 0,
          background: "rgba(0,0,0,.18)",
          color: "inherit",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}