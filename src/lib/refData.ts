export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const systemRates: Record<string, { low: number; high: number; gradient: string }> = {
  "Epoxy Flake System": { low: 6.5, high: 8.2, gradient: "linear-gradient(135deg,#d9d9d9,#6e6e6e,#f4f4f4)" },
  "Metallic Epoxy": { low: 8.5, high: 12, gradient: "linear-gradient(135deg,#353535,#aeb4bd,#131313)" },
  "Quartz System": { low: 7.5, high: 10, gradient: "linear-gradient(135deg,#d2c2a8,#7f7569,#eee5d6)" },
  "Polished Concrete": { low: 5.5, high: 8, gradient: "linear-gradient(135deg,#d6d6d3,#8e8f8b,#f3f3ef)" },
  "Stained Concrete": { low: 4.5, high: 7, gradient: "linear-gradient(135deg,#b77c49,#d9b886,#73543a)" },
};