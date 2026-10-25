import { describe, expect, it } from 'vitest';
import { targetFreq, windowFor } from '../src/ui/use-tuner';
import type { Settings } from '../src/state/storage';

const guitar = { notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] } as never;
const settings = { mode: 'auto', a4: 440 } as Settings;

describe('locked string', () => {
  it('sizes the window for the locked note, not the lowest string', () => {
    expect(windowFor(guitar, settings, null)).toBe(4096);
    expect(windowFor(guitar, settings, 5)).toBe(2048);
    expect(windowFor(guitar, settings, 0)).toBe(4096);
  });

  it('targets the locked note only outside chromatic mode', () => {
    expect(targetFreq(guitar, settings, null)).toBeNull();
    expect(targetFreq(guitar, settings, 5)).toBeCloseTo(329.63, 1);
    expect(targetFreq(guitar, { ...settings, mode: 'chromatic' }, 5)).toBeNull();
  });
});
