import React from "react";

const LOGO_URL = "/logo.png";

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
        filter: "drop-shadow(0 0 10px rgba(240,244,11,.25))",
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
        filter: "drop-shadow(0 0 12px rgba(240,244,11,.28))",
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