import React from "react";

/** @param {{ children?: React.ReactNode; text?: React.ReactNode }} props */
export default function Disclosure({ children }) {
  return (
    <div className="vx-notice" style={{ marginTop: 10 }}>
      {children}
    </div>
  );
}