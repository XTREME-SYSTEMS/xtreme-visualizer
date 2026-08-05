import React from "react";
import ColorStudio from "@/components/vx/ColorStudio";

export default function Blends() {
  return (
    <ColorStudio
      system="flake"
      title="Flake Blends"
      kicker="Selected flake blend"
      sessionKey="blendCode"
    />
  );
}