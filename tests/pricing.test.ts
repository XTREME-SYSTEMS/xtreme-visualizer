import { describe, it, expect } from 'vitest';
import { computeRange, money, DEFAULT_RULES } from '@/lib/pricing';

describe('computeRange', () => {
  it('computes a basic range with fair condition factor and spread', () => {
    const r = computeRange({ square_feet: 1000, base_rate_low: 5, base_rate_high: 9, condition: 'fair' });
    expect(r.low).toBe(5000);
    expect(r.high).toBe(10450);
    expect(r.version).toBe(DEFAULT_RULES.version);
  });

  it('adds grinding and crack repair add-ons', () => {
    const r = computeRange({
      square_feet: 500,
      base_rate_low: 4,
      base_rate_high: 8,
      condition: 'good',
      needs_grinding: true,
      linear_feet_cracks: 10,
    });
    expect(r.low).toBe(2375);
    expect(r.high).toBe(4925);
  });

  it('floors to min_job_price when sqft is zero', () => {
    const r = computeRange(
      { square_feet: 0, base_rate_low: 0, base_rate_high: 0 },
      { ...DEFAULT_RULES, min_job_price: 2000 }
    );
    expect(r.low).toBe(2000);
    expect(r.high).toBe(2500);
  });

  it('applies poor condition factor (1.2)', () => {
    const r = computeRange({ square_feet: 1000, base_rate_low: 5, base_rate_high: 5, condition: 'poor' });
    expect(r.low).toBe(5550);
    expect(r.high).toBe(6450);
  });

  it('includes mobilization fee', () => {
    const r = computeRange(
      { square_feet: 100, base_rate_low: 5, base_rate_high: 5, condition: 'good' },
      { ...DEFAULT_RULES, mobilization_fee: 300 }
    );
    // low = 500 + 300 = 800, spread -7.5% = 740, round to 25 = 750
    // high = 500 + 300 = 800, spread +7.5% = 860, round to 25 = 850
    expect(r.low).toBe(750);
    expect(r.high).toBe(850);
  });
});

describe('money', () => {
  it('formats a number with $ and thousands separators', () => {
    expect(money(5000)).toBe('$5,000');
    expect(money(1234567)).toBe('$1,234,567');
  });

  it('returns em-dash for non-numbers', () => {
    expect(money(undefined)).toBe('—');
    expect(money(NaN)).toBe('—');
    expect(money(null)).toBe('—');
  });
});