import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wand2, Loader2 } from "lucide-react";

const FIELD_PROMPTS = {
  city: "Suggest a real US city where this type of business would thrive. Return ONLY the city name, nothing else.",
  state: "Suggest the 2-letter US state abbreviation that pairs with the city. Return ONLY the 2-letter code, nothing else.",
  industry: "Suggest a specific trade or service industry for this business. Return ONLY the industry name (e.g. 'Epoxy floor coatings'), nothing else.",
  specialties: "Suggest 3-5 specific services or differentiators this business would offer, comma-separated. Return ONLY the comma-separated list, nothing else.",
  targetCustomer: "Suggest the primary target customer for this business. Return ONLY a short description (e.g. 'homeowners, property managers'), nothing else.",
  notes: "Suggest helpful branding notes — keywords to include, names to avoid, or style preferences. Return ONLY 1-2 short sentences, nothing else.",
};

export default function AiFieldButton({ field, onboarding, onApply }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const context = Object.entries(onboarding)
        .filter(([k, v]) => k !== field && v && String(v).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      const prompt =
        `You are helping a user fill out a business onboarding form.\n` +
        `Based on the context below, suggest a value for the "${field}" field.\n\n` +
        `Context from other fields:\n${context || "(no other fields filled in yet)"}\n\n` +
        `${FIELD_PROMPTS[field] || `Suggest a value for the "${field}" field. Return ONLY the value, nothing else.`}`;

      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const value = String(res || "").trim().replace(/^["']|["']$/g, "");
      if (value) onApply(value);
    } catch (e) {
      // silently fail — user can retry or type manually
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={`AI fill ${field}`}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
        height: 42,
        borderRadius: 12,
        border: "1px solid var(--vx-accent)",
        background: "var(--vx-accent-soft)",
        color: "var(--vx-accent)",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: ".03em",
        whiteSpace: "nowrap",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "opacity .15s",
      }}
    >
      {loading ? (
        <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
      ) : (
        <Wand2 style={{ width: 15, height: 15 }} />
      )}
      {loading ? "AI…" : "AI"}
    </button>
  );
}