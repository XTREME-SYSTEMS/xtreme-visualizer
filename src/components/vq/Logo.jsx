import React from "react";

const LOGO_URL =
  "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/aee59f2a2_ChatGPTImageAug6202604_27_16PM.png";

/**
 * Xtreme Floor Visualizer — full logo asset (emblem + wordmark).
 * Uses the exact brand package graphic in every rendering context.
 */
export function LogoMark({ size = 36, dark = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="Xtreme Floor Visualizer"
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        flexShrink: 0,
        filter: "drop-shadow(0 0 10px rgba(255,215,0,.25))",
      }}
    />
  );
}

export function LogoFull({ size = 36, dark = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="Xtreme Floor Visualizer"
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        filter: "drop-shadow(0 0 12px rgba(255,215,0,.28))",
      }}
    />
  );
}

export function LogoCompact({ size = 28, dark = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="Xtreme Floor Visualizer"
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
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