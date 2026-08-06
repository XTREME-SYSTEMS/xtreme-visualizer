import { base44 } from "@/api/base44Client";
import { FLOOR_TYPE_OPTIONS, generateSpecs } from "@/data/floorSpecs";
import { DEFAULT_RULES } from "@/lib/pricing";

const DEFAULT_RATES = {
  "Metallic Epoxy": { low: 7, high: 12 },
  "Multi-Color Metallic Epoxy": { low: 8, high: 14 },
  "Flake Epoxy": { low: 5, high: 9 },
  "Quartz System": { low: 6, high: 11 },
  "Solid Epoxy": { low: 5, high: 8 },
  "Stained Concrete": { low: 4, high: 8 },
  "Polished Concrete": { low: 4, high: 9 },
  "Glitter Epoxy": { low: 6, high: 11 },
  "Joint Filler": { low: 3, high: 6 },
  "Concrete Overlayment": { low: 6, high: 12 },
  "Sealed Concrete": { low: 3, high: 6 },
};

const CONDITION_FACTOR = { good: 1, fair: 1.08, poor: 1.2 };

export const TERMS_TEXT =
  "1. This proposal is valid for 30 days from the date above. 2. A 50% deposit is required to schedule the work; the balance is due upon completion. 3. The customer is responsible for clearing the workspace of all furniture, vehicles, and personal belongings prior to the crew's arrival. 4. Pricing is based on the stated square footage and condition; any variance discovered on site may result in a change order. 5. The company is fully licensed and insured; certificates of insurance are available upon request. 6. A change order must be approved in writing by both parties before additional work is performed. 7. Payment terms are net upon completion; late payments may incur a 1.5% monthly finance charge. 8. The company is not responsible for damage caused by pre-existing latent defects, moisture conditions not disclosed, or work performed by others. 9. This proposal, once signed, constitutes the agreement between the parties.";

export const WARRANTY_TEXT =
  "The company warrants its workmanship for a period of two (2) years from the date of installation. This warranty covers peeling, delamination, or failure of the installed flooring system attributable to improper installation. It does not cover damage caused by moisture intrusion from below the slab, hydrostatic pressure, acts of God, abuse, neglect, improper maintenance, chemical exposure beyond normal residential or commercial use, or modifications by others. Manufacturer product warranties apply separately and are passed through to the customer. To make a warranty claim, contact the company in writing within the warranty period. This warranty is in lieu of all other warranties, express or implied.";

export async function parseBidSentence(sentence, floorSystems, colorCharts) {
  const systemNames = (floorSystems || []).map((s) => s.name).join(", ");
  const colorNames = (colorCharts || [])
    .slice(0, 80)
    .map((c) => c.color_name)
    .filter(Boolean)
    .join(", ");

  const prompt = `You are a flooring estimator for a concrete polishing & epoxy company. Parse the user's request into a structured bid input.

Available floor types: ${FLOOR_TYPE_OPTIONS.join(", ")}
Available floor systems in our catalog: ${systemNames || "(use the floor types)"}
Available color names: ${colorNames || "(pick a sensible default)"}

User request: """${sentence}"""

Extract every field. If a value is not stated, infer a reasonable default for the floor type and a typical residential/commercial space. Always return a numeric square_feet (guess 500 if unspecified). For prep work (cracks, joints, patch), infer reasonable non-zero quantities when the user mentions "cracks", "spalls", "joints", "patch", or a worn floor; default to 0 only when the floor is described as new or in good condition.

Return strict JSON matching the schema.`;

  const schema = {
    type: "object",
    properties: {
      customer_name: { type: "string" },
      project_address: { type: "string" },
      floor_type: { type: "string" },
      square_feet: { type: "number" },
      condition: { type: "string" },
      needs_grinding: { type: "boolean" },
      needs_moisture_mitigation: { type: "boolean" },
      has_cracks: { type: "boolean" },
      linear_feet_cracks: { type: "number" },
      has_joints: { type: "boolean" },
      linear_feet_joints: { type: "number" },
      has_coving: { type: "boolean" },
      linear_feet_coving: { type: "number" },
      patch_count: { type: "number" },
      excessive_patch_count: { type: "number" },
      large_patch_count: { type: "number" },
      demolition_sqft: { type: "number" },
      extra_prep: { type: "boolean" },
      color_name: { type: "string" },
      finish: { type: "string" },
      logo_description: { type: "string" },
    },
    required: ["floor_type", "square_feet"],
  };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
    model: "gemini_3_flash",
  });
  return result;
}

export function buildBid(input, floorSystems, colorCharts, rules = DEFAULT_RULES) {
  const r = { ...DEFAULT_RULES, ...rules };
  const sqft = Number(input.square_feet) || 0;
  const condition = input.condition || "fair";
  const floorType = input.floor_type || "Flake Epoxy";

  const sys = (floorSystems || []).find(
    (s) =>
      s.name.toLowerCase().includes(floorType.toLowerCase()) ||
      floorType.toLowerCase().includes(s.name.toLowerCase())
  );
  const rates = sys
    ? { low: Number(sys.base_rate_low) || 0, high: Number(sys.base_rate_high) || 0 }
    : DEFAULT_RATES[floorType] || { low: 5, high: 9 };
  const baseRate = (rates.low + rates.high) / 2;

  const color = (colorCharts || []).find(
    (c) => c.color_name && c.color_name.toLowerCase() === (input.color_name || "").toLowerCase()
  ) ||
    (colorCharts || []).find(
      (c) => c.color_name && c.color_name.toLowerCase().includes((input.color_name || "").toLowerCase())
    );

  const conditionFactor = CONDITION_FACTOR[condition] || 1.08;

  const lineItems = [];
  lineItems.push({
    name: `${floorType} flooring system`,
    detail: `${sqft.toLocaleString()} sq ft @ $${baseRate.toFixed(2)}/sq ft${color ? ` — ${color.color_name}` : ""}${input.finish ? ` — ${input.finish}` : ""}`,
    quantity: sqft,
    rate: baseRate,
    amount: sqft * baseRate,
  });
  if (input.needs_grinding) {
    lineItems.push({ name: "Surface preparation — diamond grind", detail: `${sqft.toLocaleString()} sq ft @ $${r.prep_grinding_rate}/sq ft to CSP-2/3 profile`, quantity: sqft, rate: r.prep_grinding_rate, amount: sqft * r.prep_grinding_rate });
  }
  if (input.needs_moisture_mitigation) {
    lineItems.push({ name: "Moisture mitigation", detail: `${sqft.toLocaleString()} sq ft @ $${r.moisture_mitigation_rate}/sq ft vapor barrier primer`, quantity: sqft, rate: r.moisture_mitigation_rate, amount: sqft * r.moisture_mitigation_rate });
  }
  const crackLf = Number(input.linear_feet_cracks) || 0;
  if (crackLf > 0) {
    lineItems.push({ name: "Crack repair", detail: `${crackLf} linear ft @ $${r.crack_repair_rate}/lf — two-part epoxy repair mortar, ground flush`, quantity: crackLf, rate: r.crack_repair_rate, amount: crackLf * r.crack_repair_rate });
  }
  const jointLf = Number(input.linear_feet_joints) || 0;
  if (jointLf > 0) {
    lineItems.push({ name: "Expansion joint fill", detail: `${jointLf} linear ft @ $${r.joint_filler_rate}/lf — semi-rigid polyurea joint filler, shaved flush`, quantity: jointLf, rate: r.joint_filler_rate, amount: jointLf * r.joint_filler_rate });
  }
  const covingLf = Number(input.linear_feet_coving) || 0;
  if (covingLf > 0) {
    lineItems.push({ name: "Cove base installation", detail: `${covingLf} linear ft @ $${r.coving_rate}/lf — epoxy cove base at perimeter walls`, quantity: covingLf, rate: r.coving_rate, amount: covingLf * r.coving_rate });
  }
  const patchCount = Number(input.patch_count) || 0;
  const excessCount = Number(input.excessive_patch_count) || 0;
  const largeCount = Number(input.large_patch_count) || 0;
  if (patchCount + excessCount + largeCount > 0) {
    const parts = [];
    if (patchCount) parts.push(`${patchCount} standard @ $${r.patch_rate}`);
    if (excessCount) parts.push(`${excessCount} excessive @ $${r.excess_patch_rate}`);
    if (largeCount) parts.push(`${largeCount} large @ $${r.large_patch_rate}`);
    const patchAmount = patchCount * r.patch_rate + excessCount * r.excess_patch_rate + largeCount * r.large_patch_rate;
    lineItems.push({ name: "Surface patchwork / spall repair", detail: `${parts.join(", ")} — epoxy repair mortar, ground flush`, quantity: patchCount + excessCount + largeCount, rate: patchAmount / (patchCount + excessCount + largeCount), amount: patchAmount });
  }
  const demoSqft = Number(input.demolition_sqft) || 0;
  if (demoSqft > 0) {
    lineItems.push({ name: "Demolition / coating removal", detail: `${demoSqft.toLocaleString()} sq ft @ $${r.demolition_rate}/sq ft`, quantity: demoSqft, rate: r.demolition_rate, amount: demoSqft * r.demolition_rate });
  }
  if (input.extra_prep) {
    lineItems.push({ name: "Excessive job site prep", detail: "Extra plastics, masking, and containment — flat fee", quantity: 1, rate: r.extra_prep_rate, amount: r.extra_prep_rate });
  }
  if (r.mobilization_fee > 0) {
    lineItems.push({ name: "Mobilization fee", detail: "Travel, equipment, and crew mobilization", quantity: 1, rate: r.mobilization_fee, amount: r.mobilization_fee });
  }

  lineItems.forEach((li) => {
    if (li.name !== "Mobilization fee") li.amount = Math.round(li.amount * conditionFactor);
  });
  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);

  const opts = {
    needs_grinding: input.needs_grinding,
    needs_moisture_mitigation: input.needs_moisture_mitigation,
    has_cracks: crackLf > 0 || input.has_cracks,
    has_joints: jointLf > 0 || input.has_joints,
    has_coving: covingLf > 0 || input.has_coving,
    needs_perimeter: true,
  };
  const scopeItems = generateSpecs(floorType, opts);

  return {
    customer_name: input.customer_name || "",
    project_address: input.project_address || "",
    floor_type: floorType,
    color_name: color ? color.color_name : input.color_name || "",
    color_hex: color ? color.hex : "",
    finish: input.finish || "",
    square_feet: sqft,
    condition,
    line_items: lineItems,
    scope_items: scopeItems,
    subtotal,
    logo_description: input.logo_description || "",
    created_date: new Date().toISOString(),
  };
}

export function applyDiscount(bid, discountPct) {
  const pct = Math.max(0, Math.min(50, Number(discountPct) || 0));
  const discountAmount = Math.round((bid.subtotal * pct) / 100);
  return { ...bid, discount_pct: pct, discount_amount: discountAmount, total: bid.subtotal - discountAmount };
}

export const money = (n) =>
  typeof n === "number" && !isNaN(n) ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";

export function bidToText(bid, companyName = "Xtreme Polishing Systems") {
  const lines = [];
  lines.push(`${companyName} — PROPOSAL`);
  lines.push(`Date: ${new Date(bid.created_date).toLocaleDateString()}`);
  lines.push("");
  lines.push("PREPARED FOR:");
  lines.push(bid.customer_name || "Valued Customer");
  if (bid.project_address) lines.push(bid.project_address);
  lines.push("");
  lines.push(`PROJECT: ${bid.floor_type} — ${bid.square_feet.toLocaleString()} sq ft (${bid.condition} condition)`);
  if (bid.color_name) lines.push(`Color: ${bid.color_name}`);
  if (bid.finish) lines.push(`Finish: ${bid.finish}`);
  lines.push("");
  lines.push("SCOPE OF WORK:");
  bid.scope_items.forEach((s, i) => lines.push(`${i + 1}. ${s.label}: ${s.detail}`));
  lines.push("");
  lines.push("INVESTMENT:");
  bid.line_items.forEach((li) => lines.push(`- ${li.name} (${li.detail}): ${money(li.amount)}`));
  lines.push("");
  lines.push(`Subtotal: ${money(bid.subtotal)}`);
  if (bid.discount_amount > 0) lines.push(`Discount (${bid.discount_pct}%): -${money(bid.discount_amount)}`);
  lines.push(`TOTAL: ${money(bid.total)}`);
  lines.push("");
  lines.push("TERMS & CONDITIONS:");
  lines.push(TERMS_TEXT);
  lines.push("");
  lines.push("WARRANTY:");
  lines.push(WARRANTY_TEXT);
  return lines.join("\n");
}