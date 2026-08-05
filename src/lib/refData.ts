import { getSystemGradient } from './floorColors';

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const STATUS_LABELS: Record<string, string> = {
  new: "New Lead",
  qualified: "Qualified",
  estimate_sent: "Estimate Sent",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  follow_up: "Follow Up",
};

export function leadToProject(lead: any) {
  return {
    id: lead.id,
    name: lead.customer_name || lead.name || "Untitled",
    location: lead.project_address || lead.address || "",
    system: lead.system_name || lead.floor_system || lead.floor_type || "",
    status: STATUS_LABELS[lead.status] || lead.status || "New Lead",
    image: lead.photo_url || lead.project_image_url || "",
    high: lead.estimate_high || lead.preliminary_high || 0,
    low: lead.estimate_low || lead.preliminary_low || 0,
    updatedAt: lead.updated_date || lead.updatedAt,
  };
}

export function projectsFromLeads(leads: any[]) {
  return (leads || []).map(leadToProject);
}

export const systemRates: Record<string, { low: number; high: number; gradient: string }> = {
  "Flake Epoxy": { low: 6.0, high: 9.0, gradient: getSystemGradient("Flake Epoxy") },
  "Metallic Epoxy": { low: 8.5, high: 12.0, gradient: getSystemGradient("Metallic Epoxy") },
  "Solid Color Epoxy": { low: 4.5, high: 7.5, gradient: getSystemGradient("Solid Color Epoxy") },
  "Quartz System": { low: 9.0, high: 14.0, gradient: getSystemGradient("Quartz System") },
  "Glitter Epoxy": { low: 7.0, high: 11.0, gradient: getSystemGradient("Glitter Epoxy") },
  "Polished Concrete": { low: 5.0, high: 8.5, gradient: getSystemGradient("Polished Concrete") },
  "Stained Concrete": { low: 3.5, high: 6.0, gradient: getSystemGradient("Stained Concrete") },
  "Joint Fill & Repair": { low: 12.0, high: 18.0, gradient: getSystemGradient("Joint Fill & Repair") },
};