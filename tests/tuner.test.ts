import { describe, expect, it } from 'vitest';
import { Tuner, type TunerConfig } from '../src/music/tuner';

const E2 = 82.4069;
const at = (freq: number, c: number) => freq * 2 ** (c / 1200);
const config = (over: Partial<TunerConfig> = {}): TunerConfig => ({
  notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  a4: 440,
  mode: 'auto',
  manualIndex: 0,
  thresholdCents: 3,
  ...over,
});

describe('Tuner', () => {
  it('returns null when idle', () => {
    expect(new Tuner(config()).update(null, 0)).toBeNull();
  });

  it('auto mode: 84 Hz is E2 about +33 cents, not in tune', () => {
    const view = new Tuner(config()).update(84, 0)!;
    expect(view).toMatchObject({ note: 'E2', stringIndex: 0, outOfRange: false, inTune: false });
    expect(view.cents).toBeCloseTo(33, 0);
  });

  it('applies hysteresis: in at ±3, out beyond ±5', () => {
    const t = new Tuner(config());
    expect(t.update(at(E2, 2), 0)!.inTune).toBe(true);
    expect(t.update(at(E2, 4), 40)!.inTune).toBe(true);
    expect(t.update(at(E2, 6), 80)!.inTune).toBe(false);
  });

  it('marks a string after 500 ms inside the threshold', () => {
    const t = new Tuner(config());
    t.update(E2, 0);
    t.update(E2, 400);
    expect(t.confirmed.has(0)).toBe(false);
    t.update(E2, 500);
    expect(t.confirmed.has(0)).toBe(true);
  });

  it('restarts the 500 ms timer when leaving the threshold', () => {
    const t = new Tuner(config());
    t.update(E2, 0);
    t.update(at(E2, 4), 300); // still "in tune" by hysteresis, but outside ±3
    t.update(E2, 400);
    t.update(E2, 800);
    expect(t.confirmed.has(0)).toBe(false);
    t.update(E2, 900);
    expect(t.confirmed.has(0)).toBe(true);
  });

  it('out of range: shows the real note', () => {
    const view = new Tuner(config()).update(58.27, 0)!;
    expect(view.outOfRange).toBe(true);
    expect(view.note).toBe('A#1');
    expect(view.cents).toBeLessThan(-50);
  });

  it('manual mode targets the chosen string', () => {
    const view = new Tuner(config({ mode: 'manual', manualIndex: 1 })).update(84, 0)!;
    expect(view.stringIndex).toBe(1);
    expect(view.outOfRange).toBe(true);
  });

  it('chromatic mode ignores the strings', () => {
    const view = new Tuner(config({ mode: 'chromatic' })).update(445, 0)!;
    expect(view).toMatchObject({ note: 'A4', stringIndex: -1 });
  });

  it('keeps marks for the same notes and clears them for new ones', () => {
    const t = new Tuner(config());
    t.update(E2, 0);
    t.update(E2, 600);
    t.configure(config({ a4: 441 }));
    expect(t.confirmed.has(0)).toBe(true);
    t.configure(config({ notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] }));
    expect(t.confirmed.size).toBe(0);
  });
});
