import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Landing from "@/pages/Landing";

export default function RootRoute() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authChecked } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 grid place-items-center" style={{ background: "#030303" }}>
        <div
          className="w-7 h-7 border-4 rounded-full animate-spin"
          style={{ borderColor: "rgba(240,244,11,.18)", borderTopColor: "#f0f40b" }}
        />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/app" replace /> : <Landing />;
}