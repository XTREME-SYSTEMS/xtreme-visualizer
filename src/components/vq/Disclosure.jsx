import React from "react";

export default function Disclosure({ children }) {
  return (
    <div className="vx-notice" style={{ marginTop: 10 }}>
      {children}
    </div>
  );
}