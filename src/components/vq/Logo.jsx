import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/e29617215_ChatGPTImageAug6202604_27_16PM.png";

export function LogoMark({ size = 36, dark = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="xtremeGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFED00" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#E6BE00" />
        </linearGradient>
        <linearGradient id="xtremeSilver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#808080" />
        </linearGradient>
        <filter id="xtremeGlow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#1A1A1A" stroke="url(#xtremeGold)" strokeWidth="1.5" filter="url(#xtremeGlow)" />
      {/* X mark — gold center, silver edges */}
      <path d="M14 14 L24 24 L14 34" stroke="url(#xtremeSilver)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M34 14 L24 24 L34 34" stroke="url(#xtremeSilver)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M18 14 L24 22 L18 30" stroke="url(#xtremeGold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#xtremeGlow)" />
      <path d="M30 14 L24 22 L30 30" stroke="url(#xtremeGold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#xtremeGlow)" />
    </svg>
  );
}

export function LogoFull({ size = 36, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} dark={dark} />
      <div className="leading-none">
        <div className={`text-[20px] font-black italic tracking-[0.04em] ${dark ? "text-white" : "text-black"}`} style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>
          <span style={{ color: "#FFD700" }}>X</span>TREME
        </div>
        <div className="mt-1 text-[7px] font-extrabold tracking-[0.32em]" style={{ color: "#FFD700", background: "#1A1A1A", padding: "2px 6px", borderRadius: 3, display: "inline-block" }}>FLOOR VISUALIZER</div>
      </div>
    </div>
  );
}

export function LogoCompact({ size = 28, dark = false }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} dark={dark} />
      <span className={`text-[14px] font-bold italic tracking-tight ${dark ? "text-white" : "text-black"}`}><span style={{ color: "#FFD700" }}>X</span>treme</span>
    </div>
  );
}

export function LogoImage({ size = 36, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="Xtreme Floor Visualizer"
      className={className}
      style={{ height: size, width: "auto", objectFit: "contain" }}
    />
  );
}

export default LogoFull;