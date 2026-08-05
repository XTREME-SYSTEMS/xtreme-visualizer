import React from "react";
import { Link } from "react-router-dom";

export default function RefLogo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="xv-logo">
      <div className="xv-logo-mark">
        <span />
      </div>
      <div className="xv-logo-word">
        <div className="xv-logo-main">XTREME</div>
        <div className="xv-logo-sub">VIZUALIZER</div>
      </div>
    </Link>
  );
}