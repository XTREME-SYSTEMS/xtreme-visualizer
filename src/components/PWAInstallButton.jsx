import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
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

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px 10px 16px",
        borderRadius: 14,
        background: "linear-gradient(135deg, #FFD700, #FFED00)",
        color: "#1A1A1A",
        boxShadow: "0 0 28px rgba(255,215,0,.4), 0 8px 24px rgba(0,0,0,.5)",
        border: "1px solid #FFD700",
        maxWidth: "calc(100vw - 32px)",
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
          color: "#1A1A1A",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Download size={18} strokeWidth={2.5} />
        <span>Install Xtreme</span>
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: 0,
          background: "rgba(26,26,26,.15)",
          color: "#1A1A1A",
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