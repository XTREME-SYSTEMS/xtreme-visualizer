// Pricing engine — preliminary, non-binding range calculation.
// Ported from visual-x2. Factors in condition, grinding, moisture, cracks, coving, mobilization.

export const DEFAULT_RULES = {
  version: "v1.0",
  mobilization_fee: 350,
  min_job_price: 1200,
  prep_grinding_rate: 0.75,
  moisture_mitigation_rate: 1.5,
  crack_repair_rate: 12,
  coving_rate: 18,
  range_spread_pct: 0.15,
};

const CONDITION_FACTOR: Record<string, number> = { good: 1, fair: 1.08, poor: 1.2 };

export interface RangeInput {
  square_feet?: number;
  condition?: string;
  base_rate_low?: number;
  base_rate_high?: number;
  needs_grinding?: boolean;
  needs_moisture_mitigation?: boolean;
  linear_feet_cracks?: number;
  linear_feet_coving?: number;
}

export interface RangeResult {
  low: number;
  high: number;
  version: string;
}

// Preliminary, non-binding range. Never presented as a final price.
export function computeRange(input: RangeInput, rules: Partial<typeof DEFAULT_RULES> = DEFAULT_RULES): RangeResult {
  const r = { ...DEFAULT_RULES, ...rules };
  const sqft = Number(input.square_feet) || 0;
  const factor = CONDITION_FACTOR[input.condition || 'fair'] || 1;

  let low = sqft * (Number(input.base_rate_low) || 0);
  let high = sqft * (Number(input.base_rate_high) || 0);

  if (input.needs_grinding) {
    const g = sqft * r.prep_grinding_rate;
    low += g; high += g;
  }
  if (input.needs_moisture_mitigation) {
    const m = sqft * r.moisture_mitigation_rate;
    low += m; high += m;
  }
  const cracks = (Number(input.linear_feet_cracks) || 0) * r.crack_repair_rate;
  const coving = (Number(input.linear_feet_coving) || 0) * r.coving_rate;

  low = (low + cracks + coving) * factor + r.mobilization_fee;
  high = (high + cracks + coving) * factor + r.mobilization_fee;

  low = Math.max(low * (1 - r.range_spread_pct / 2), r.min_job_price);
  high = Math.max(high * (1 + r.range_spread_pct / 2), r.min_job_price * 1.25);

  return {
    low: Math.round(low / 25) * 25,
    high: Math.round(high / 25) * 25,
    version: r.version,
  };
}

export const money = (n: number | undefined | null): string =>
  typeof n === "number" && !isNaN(n) ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";