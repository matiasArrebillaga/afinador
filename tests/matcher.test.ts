import { describe, expect, it } from 'vitest';
import { OUT_OF_RANGE_CENTS, matchChromatic, matchIndex, matchString } from '../src/music/matcher';

const STANDARD = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

describe('matcher', () => {
  it('84 Hz in standard is E2 about +33 cents', () => {
    const m = matchString(84, STANDARD, 440);
    expect(m.index).toBe(0);
    expect(m.note).toBe('E2');
    expect(m.cents).toBeCloseTo(33, 0);
  });

  it('picks the nearest string in cents', () => {
    expect(matchString(196, STANDARD, 440).note).toBe('G3');
    expect(matchString(250, STANDARD, 440).note).toBe('B3');
  });

  it('uses the configured A4', () => {
    expect(matchString(108, STANDARD, 432).cents).toBeCloseTo(0, 6);
  });

  it('reports far-away notes as beyond the out-of-range limit', () => {
    expect(Math.abs(matchString(60, STANDARD, 440).cents)).toBeGreaterThan(OUT_OF_RANGE_CENTS);
  });

  it('manual match targets the given string and clamps the index', () => {
    const m = matchIndex(84, STANDARD, 1, 440);
    expect(m.note).toBe('A2');
    expect(m.cents).toBeLessThan(-400);
    expect(matchIndex(84, STANDARD, 9, 440).index).toBe(5);
  });

  it('chromatic match finds the nearest semitone', () => {
    const m = matchChromatic(445, 440);
    expect(m).toMatchObject({ index: -1, note: 'A4' });
    expect(m.cents).toBeCloseTo(19.56, 1);
    expect(matchChromatic(58.27, 440).note).toBe('A#1');
  });
});
