// Quote-to-Close package engine — Good / Better / Best tiers.
// Ported from visual-x2. Factor is applied to the midpoint of the lead's preliminary estimate range.

import { money } from './pricing';

export const PACKAGE_TIERS = [
  { id: "good", name: "Essential", margin: 0.32, factor: 0.85, blurb: "Core scope, standard surface protection, 1-year workmanship warranty placeholder." },
  { id: "better", name: "Recommended", margin: 0.38, factor: 1.0, blurb: "Enhanced prep, premium guard sealer, extended protection, priority scheduling.", recommended: true },
  { id: "best", name: "Premier", margin: 0.43, factor: 1.22, blurb: "Phased execution, highest finish level, dedicated crew, priority support." },
];

export interface PackageResult {
  id: string;
  name: string;
  margin: number;
  recommended: boolean;
  price: number;
  detail: string;
}

export function buildPackages(lead: { adjusted_low?: number; estimate_low?: number; adjusted_high?: number; estimate_high?: number }, rangeOverride?: { low: number; high: number }): PackageResult[] {
  const low = Number(rangeOverride?.low ?? lead.adjusted_low ?? lead.estimate_low ?? 0);
  const high = Number(rangeOverride?.high ?? lead.adjusted_high ?? lead.estimate_high ?? 0);
  const base = (low + high) / 2 || 0;
  return PACKAGE_TIERS.map((t) => ({
    id: t.id,
    name: t.name,
    margin: t.margin,
    recommended: !!t.recommended,
    price: Math.max(Math.round((base * t.factor) / 25) * 25, 0),
    detail: t.blurb,
  }));
}

export const EMAIL_TYPES = [
  { id: "proposal_delivery", label: "Proposal Delivery" },
  { id: "follow_up", label: "Follow-Up" },
  { id: "estimate_followup", label: "Estimate Follow-Up" },
  { id: "welcome", label: "Welcome / Introduction" },
  { id: "appointment_confirmation", label: "Appointment Confirmation" },
  { id: "thank_you", label: "Thank You (Post-Sign)" },
];

export const EMAIL_JSON_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
};

export function emailPrompt(lead: any, emailType: string, brand?: { company_name?: string; tagline?: string } | null): string {
  const company = brand?.company_name || "National Concrete Polishing";
  const tagline = brand?.tagline || "";
  const typeLabel = EMAIL_TYPES.find((t) => t.id === emailType)?.label || emailType;
  return [
    `Write a professional, concise email for a flooring contractor to send to a customer.`,
    `Company: ${company}`,
    tagline ? `Tagline: ${tagline}` : "",
    `Email type: ${typeLabel}`,
    `Customer name: ${lead.customer_name || "—"}`,
    `Project address: ${lead.project_address || "—"}`,
    `Floor system: ${lead.system_name || lead.floor_type || "—"}`,
    `Square feet: ${lead.square_feet || "—"}`,
    `Preliminary range: ${money(lead.estimate_low ?? lead.adjusted_low)} – ${money(lead.estimate_high ?? lead.adjusted_high)}`,
    lead.proposal_total ? `Proposal total: ${money(lead.proposal_total)}` : "",
    lead.desired_install_date ? `Desired install date: ${lead.desired_install_date}` : "",
    "",
    "Rules: Be professional and warm. Never promise a final price, fixed completion date, or warranty in the email body. Keep under 250 words. Return JSON with 'subject' and 'body' fields.",
  ].filter(Boolean).join("\n");
}

export function proposalPrompt(lead: any, packages: PackageResult[], brand?: { company_name?: string; tagline?: string }): string {
  const pkgLines = packages
    .map((p) => `- ${p.name}: ${money(p.price)} (target gross margin ${Math.round(p.margin * 100)}%) — ${p.detail}`)
    .join("\n");
  return [
    "Write a professional, branded flooring proposal in Markdown for a contractor to review before sending.",
    `Brand: ${brand?.company_name || "VisualQuote Pro"}`,
    brand?.tagline ? `Tagline: ${brand.tagline}` : "",
    `Customer: ${lead.customer_name}`,
    `Project address: ${lead.project_address || "—"}`,
    `Space: ${lead.space_type}`,
    `System: ${lead.system_name || "—"}`,
    `Area: ${lead.square_feet || "—"} sq ft, condition ${lead.condition}`,
    `Preliminary range: ${money(lead.adjusted_low ?? lead.estimate_low)} – ${money(lead.adjusted_high ?? lead.estimate_high)}`,
    "",
    "Packages:",
    pkgLines,
    "",
    "Include: Cover, Executive Summary, Understanding of the Project, Scope of Work, Pricing, Warranty, Terms, Call to Action.",
  ].filter(Boolean).join("\n");
}