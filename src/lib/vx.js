import { base44 } from "@/api/base44Client";

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const ROUTE_TITLES = {
  home: "Home Hub",
  scan: "Room Scan",
  visualizer: "Live Visualizer",
  compare: "Compare Finishes",
  blends: "Flake Blend Studio",
  metallic: "Metallic Studio",
  products: "Products & Colors",
  quote: "Smart Quote",
  proposal: "Proposal Share",
  lead: "Onsite Lead Capture",
};

export const SPACE_PRESETS = ["garage", "showroom", "warehouse", "patio"];

export const DEFAULT_MASK = [
  [0.08, 0.62],
  [0.92, 0.62],
  [0.99, 0.98],
  [0.01, 0.98],
];

export function quoteTotals(lineItems = [], marginPercent = 0) {
  const subtotal = lineItems.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
    0
  );
  const margin = subtotal * ((Number(marginPercent) || 0) / 100);
  const total = subtotal + margin;
  return { subtotal, margin, total, low: total * 0.92, high: total * 1.08 };
}

export function polygonArea(points, squareFeet) {
  if (!Number.isFinite(squareFeet) || squareFeet <= 0) return 0;
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2) * squareFeet;
}

export function coveragePct(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.round(Math.abs(a / 2) * 100);
}

export async function receipt({ action, detail, category = "audit", lead_id, project_id }) {
  const key = `${action}-${lead_id || project_id || "none"}-${Date.now()}`;
  return base44.entities.ActivityReceipt.create({
    action,
    detail,
    category,
    lead_id,
    project_id,
    idempotency_key: key,
    actor: "operator",
    rollback_hint: "Delete this receipt and the linked record to reverse this action.",
  });
}

export function baseLineItems(squareFeet, system) {
  const sf = Number(squareFeet) || 0;
  const low = Number(system?.base_rate_low) || 0;
  const high = Number(system?.base_rate_high) || 0;
  const mid = (low + high) / 2 || 0;
  return [
    { name: "Surface Prep", description: "Diamond grind", quantity: sf, rate: Number((mid * 0.2).toFixed(2)) },
    { name: "Base Coat", description: "Epoxy primer", quantity: sf, rate: Number((mid * 0.22).toFixed(2)) },
    { name: "Finish System", description: system?.name || "System pending", quantity: sf, rate: Number((mid * 0.36).toFixed(2)) },
    { name: "Top Coat", description: "Polyaspartic clear", quantity: sf, rate: Number((mid * 0.22).toFixed(2)) },
  ];
}

export const DEFAULT_TASKS = [
  { label: "Confirm slab moisture reading", done: false },
  { label: "Photograph cracks and spalls", done: false },
  { label: "Record verified square footage", done: false },
  { label: "Review finish selection with customer", done: false },
];

export const BLOCKED_ACTIONS = [
  "Customer email and SMS",
  "Payments",
  "Legally binding e-signature",
  "Production connectors",
  "Automatic bid submission",
  "Automatic AI masking",
];