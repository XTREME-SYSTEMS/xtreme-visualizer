import React from "react";

export function Kicker({ children, className = "" }) {
  return <span className={`vx-kicker ${className}`}>{children}</span>;
}

export function Card({ children, className = "", ...rest }) {
  return (
    <section className={`vx-card p-4 ${className}`} {...rest}>
      {children}
    </section>
  );
}

const CHIP_TONES = {
  ready: "text-[#9cff00] bg-[rgba(156,255,0,0.12)] border-[rgba(156,255,0,0.35)]",
  progress: "text-[#43a9ff] bg-[rgba(67,169,255,0.12)] border-[rgba(67,169,255,0.35)]",
  draft: "text-[var(--vx-muted)] bg-[var(--vx-panel-2)] border-[var(--vx-border-soft)]",
  blocked: "text-[#ffd000] bg-[rgba(255,208,0,0.12)] border-[rgba(255,208,0,0.35)]",
  danger: "text-[#ff5258] bg-[rgba(255,82,88,0.12)] border-[rgba(255,82,88,0.35)]",
};

export function Chip({ tone = "draft", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${CHIP_TONES[tone] || CHIP_TONES.draft}`}
    >
      {children}
    </span>
  );
}

export function Notice({ children, tone = "warning" }) {
  const color = tone === "warning" ? "#ffd000" : "#43a9ff";
  return (
    <div
      className="rounded-2xl border p-3 text-xs leading-relaxed"
      style={{
        borderColor: `${color}55`,
        background: `${color}14`,
        color: "var(--vx-muted)",
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="vx-card flex flex-col items-center gap-2 p-6 text-center">
      <strong className="text-sm" style={{ color: "var(--vx-text)" }}>
        {title}
      </strong>
      <p className="text-xs leading-relaxed" style={{ color: "var(--vx-muted)" }}>
        {text}
      </p>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--vx-text)" }}>
          {title}
        </h1>
        {subtitle ? <Kicker className="mt-1">{subtitle}</Kicker> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <Kicker>{children}</Kicker>
      {action}
    </div>
  );
}

export function Btn({ variant = "primary", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed";
  const styles = {
    primary: "text-black shadow-[0_0_24px_rgba(156,255,0,0.28)]",
    outline: "border",
    ghost: "",
  };
  const inline =
    variant === "primary"
      ? { background: "linear-gradient(180deg, var(--vx-accent-2), var(--vx-accent))" }
      : variant === "outline"
      ? { borderColor: "var(--vx-accent)", color: "var(--vx-accent)", background: "var(--vx-accent-soft)" }
      : { color: "var(--vx-muted)", background: "var(--vx-panel-2)" };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} style={inline} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <Kicker>{label}</Kicker>
      {children}
    </label>
  );
}