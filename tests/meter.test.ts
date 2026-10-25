import { describe, expect, it } from 'vitest';
import { arcAngle, meterColor, meterHue, traceDash } from '../src/ui/components/ArcMeter';

describe('meter color', () => {
  it('is lime in tune, amber mid-way, red far off', () => {
    expect(meterHue(0)).toBe(78);
    expect(meterHue(3)).toBe(78);
    expect(meterHue(15)).toBe(40);
    expect(meterHue(35)).toBe(6);
    expect(meterHue(80)).toBe(6);
  });

  it('interpolates between stops', () => {
    expect(meterHue(9)).toBeCloseTo(59, 5);
    expect(meterHue(25)).toBeCloseTo(23, 5);
  });

  it('uses the fixed colors for idle, out of range and in tune', () => {
    expect(meterColor(null, false)).toBe('var(--fg)');
    expect(meterColor(-60, true)).toBe('var(--far)');
    expect(meterColor(-2, false)).toBe('var(--ok)');
    expect(meterColor(3, false)).toBe('var(--ok)');
    expect(meterColor(9, false)).toBe('hsl(59 90% 62%)');
  });
});

describe('arc geometry', () => {
  it('maps ±50 cents to the arc ends and clamps beyond', () => {
    expect(arcAngle(null)).toBe(0);
    expect(arcAngle(0)).toBe(0);
    expect(arcAngle(25)).toBe(45);
    expect(arcAngle(-50)).toBe(-90);
    expect(arcAngle(80)).toBe(90);
    expect(arcAngle(-500)).toBe(-90);
  });

  it('draws the trace from the center toward the dot', () => {
    expect(traceDash(0)).toBe('0 90 0 360');
    expect(traceDash(45)).toBe('0 90 45 360');
    expect(traceDash(-45)).toBe('0 45 45 360');
    expect(traceDash(90)).toBe('0 90 90 360');
    expect(traceDash(-90)).toBe('0 0 90 360');
  });
});
