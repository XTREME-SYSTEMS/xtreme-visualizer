import React from "react";

export function LogoMark({ size = 36, dark = false }) {
  const crossColor = dark ? "#0f172a" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="19" width="42" height="9" rx="4.5" fill="#E6A90B" transform="rotate(45 24 23.5)" />
      <rect x="3" y="19" width="42" height="9" rx="4.5" fill="#E6A90B" transform="rotate(-45 24 23.5)" />
      <rect x="10" y="19" width="28" height="9" rx="4.5" fill={crossColor} transform="rotate(45 24 23.5)" />
      <rect x="10" y="19" width="28" height="9" rx="4.5" fill={crossColor} transform="rotate(-45 24 23.5)" />
    </svg>
  );
}

export function LogoFull({ size = 36, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} dark={dark} />
      <div className="leading-none">
        <div className={`text-[20px] font-black tracking-[0.14em] ${dark ? "text-white" : "text-black"}`}>XTREME</div>
        <div className={`mt-1.5 text-[8px] font-extrabold tracking-[0.42em] ${dark ? "text-[#E6A90B]" : "text-[#B77A00]"}`}>VIZUALIZER</div>
      </div>
    </div>
  );
}

export function LogoCompact({ size = 28, dark = false }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} dark={dark} />
      <span className={`text-[14px] font-bold tracking-tight ${dark ? "text-white" : "text-black"}`}>Xtreme Vizualizer</span>
    </div>
  );
}

export default LogoFull;