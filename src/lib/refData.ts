import { getSystemGradient } from './floorColors';

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const systemRates: Record<string, { low: number; high: number; gradient: string }> = {
  "Flake Epoxy": { low: 6.0, high: 9.0, gradient: getSystemGradient("Flake Epoxy") },
  "Metallic Epoxy": { low: 8.5, high: 12.0, gradient: getSystemGradient("Metallic Epoxy") },
  "Solid Color Epoxy": { low: 4.5, high: 7.5, gradient: getSystemGradient("Solid Color Epoxy") },
  "Quartz System": { low: 9.0, high: 14.0, gradient: getSystemGradient("Quartz System") },
  "Glitter Epoxy": { low: 7.0, high: 11.0, gradient: getSystemGradient("Glitter Epoxy") },
  "Polished Concrete": { low: 5.0, high: 8.5, gradient: getSystemGradient("Polished Concrete") },
  "Stained Concrete": { low: 3.5, high: 6.0, gradient: getSystemGradient("Stained Concrete") },
  "Sealed Concrete": { low: 2.0, high: 4.0, gradient: getSystemGradient("Sealed Concrete") },
  "Polyaspartic Coating": { low: 5.5, high: 8.0, gradient: getSystemGradient("Polyaspartic Coating") },
  "Epoxy Cove Base": { low: 18.0, high: 28.0, gradient: getSystemGradient("Epoxy Cove Base") },
  "Joint Fill & Repair": { low: 12.0, high: 18.0, gradient: getSystemGradient("Joint Fill & Repair") },
};