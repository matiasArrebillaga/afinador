import { describe, expect, it } from 'vitest';
import { Smoother, median } from '../src/audio/smoothing';

function feed(s: Smoother, freqs: number[], start = 0): number {
  let out = 0;
  freqs.forEach((f, i) => (out = s.push(f, start + i * 40)));
  return out;
}

describe('median', () => {
  it('handles odd and even lengths', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('Smoother', () => {
  it('returns a steady frequency unchanged', () => {
    expect(feed(new Smoother(), [110, 110, 110, 110, 110])).toBeCloseTo(110, 6);
  });

  it('ignores a single spike thanks to the median', () => {
    expect(feed(new Smoother(), [110, 110, 110, 110, 116])).toBeCloseTo(110, 6);
  });

  it('smooths small changes with the EMA', () => {
    const out = feed(new Smoother(), [110, 110, 110, 110, 110, 110.5, 110.5, 110.5]);
    expect(out).toBeGreaterThan(110);
    expect(out).toBeLessThan(110.5);
  });

  it('jumps straight to a new note instead of sliding', () => {
    expect(feed(new Smoother(), [110, 110, 110, 110, 110, 147, 147, 147])).toBeCloseTo(147, 6);
  });

  it('rejects a single octave jump', () => {
    expect(feed(new Smoother(), [110, 110, 110, 110, 110, 220])).toBeCloseTo(110, 6);
  });

  it('accepts a real octave change after 3 readings (DADGAD D3 → D4)', () => {
    const out = feed(new Smoother(), [146.8, 146.8, 146.8, 146.8, 146.8, 293.7, 293.7, 293.7]);
    expect(out).toBeCloseTo(293.7, 6);
  });

  it('holds the last value for 1 s, then goes idle', () => {
    const s = new Smoother();
    s.push(110, 0);
    expect(s.current(999)).toBeCloseTo(110, 6);
    expect(s.current(1001)).toBeNull();
    expect(s.push(82.4, 1100)).toBeCloseTo(82.4, 6); // starts fresh after idling
  });
});
