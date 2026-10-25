import { describe, expect, it } from 'vitest';
import { meterColor, meterHue } from '../src/ui/components/Meter';

describe('meter color', () => {
  it('is green in tune, amber mid-way, red far off', () => {
    expect(meterHue(0)).toBe(145);
    expect(meterHue(3)).toBe(145);
    expect(meterHue(15)).toBe(40);
    expect(meterHue(35)).toBe(6);
    expect(meterHue(80)).toBe(6);
  });

  it('interpolates between stops', () => {
    expect(meterHue(9)).toBeCloseTo(92.5, 5);
    expect(meterHue(25)).toBeCloseTo(23, 5);
  });

  it('uses the fixed colors for idle and out of range', () => {
    expect(meterColor(null, false)).toBe('var(--fg)');
    expect(meterColor(-60, true)).toBe('var(--far)');
    expect(meterColor(-2, false)).toBe('hsl(145 70% 62%)');
  });
});
