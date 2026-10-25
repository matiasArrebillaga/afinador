import { describe, expect, it } from 'vitest';
import { DEFAULT_RMS_THRESHOLD, createDetector, isUsable, windowSizeFor } from '../src/audio/pitch';
import { cents } from '../src/music/notes';
import { tone } from './helpers/signal';

const SR = 48000;
const FREQS = [31, 41, 55, 82, 110, 196, 330];
const OFFSETS = [-30, 0, 30];
const SIGNALS = { sine: [1], 'strong 2nd harmonic': [0.4, 1] };

describe('pitch detection', () => {
  describe.each(FREQS)('%d Hz', (base) => {
    const size = windowSizeFor(base);
    const detect = createDetector(size);
    const tolerance = base >= 80 ? 2 : 3; // guitar vs bass

    for (const [label, harmonics] of Object.entries(SIGNALS)) {
      it.each(OFFSETS)(`${label}, %d cents`, (offset) => {
        const f = base * 2 ** (offset / 1200);
        const reading = detect(tone(f, size, SR, harmonics), SR);
        expect(Math.abs(cents(reading.freq, f))).toBeLessThan(tolerance);
        expect(isUsable(reading, DEFAULT_RMS_THRESHOLD)).toBe(true);
      });
    }
  });

  it('chooses the window from the lowest string', () => {
    expect(windowSizeFor(30.87)).toBe(8192);
    expect(windowSizeFor(82.41)).toBe(4096);
    expect(windowSizeFor(110)).toBe(2048);
    expect(windowSizeFor(null)).toBe(4096);
  });

  it('silence is not usable', () => {
    const reading = createDetector(2048)(new Float32Array(2048), SR);
    expect(isUsable(reading, DEFAULT_RMS_THRESHOLD)).toBe(false);
  });

  it('rejects quiet, unclear and out-of-range readings', () => {
    const ok = { freq: 110, clarity: 0.95, rms: 0.1 };
    expect(isUsable(ok, DEFAULT_RMS_THRESHOLD)).toBe(true);
    expect(isUsable({ ...ok, rms: 0.001 }, DEFAULT_RMS_THRESHOLD)).toBe(false);
    expect(isUsable({ ...ok, clarity: 0.8 }, DEFAULT_RMS_THRESHOLD)).toBe(false);
    expect(isUsable({ ...ok, freq: 20 }, DEFAULT_RMS_THRESHOLD)).toBe(false);
    expect(isUsable({ ...ok, freq: 1500 }, DEFAULT_RMS_THRESHOLD)).toBe(false);
  });

  it('with a target, accepts less clear readings near it or its octave', () => {
    const r = { freq: 330, clarity: 0.85, rms: 0.1 };
    expect(isUsable(r, DEFAULT_RMS_THRESHOLD, 329.63)).toBe(true);
    expect(isUsable({ ...r, freq: 300 }, DEFAULT_RMS_THRESHOLD, 329.63)).toBe(true); // flat string
    expect(isUsable({ ...r, freq: 165 }, DEFAULT_RMS_THRESHOLD, 82.41)).toBe(true); // 2nd harmonic
    expect(isUsable({ ...r, freq: 220 }, DEFAULT_RMS_THRESHOLD, 329.63)).toBe(false); // far off
    expect(isUsable({ ...r, clarity: 0.7 }, DEFAULT_RMS_THRESHOLD, 329.63)).toBe(false);
  });
});
