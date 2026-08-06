import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/aee59f2a2_ChatGPTImageAug6202604_27_16PM.png"
            alt="Xtreme Floor Visualizer"
            className="mx-auto mb-4"
            style={{ height: 56, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(255,215,0,.3))" }}
          />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}