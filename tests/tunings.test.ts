import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_TUNINGS,
  DEFAULT_TUNING_ID,
  STRING_COUNTS,
  findTuning,
  isValidName,
  isValidTuningShape,
  standardFor,
  tuningsFor,
} from '../src/music/tunings';

describe('tunings', () => {
  it('every built-in tuning is valid and has a unique id', () => {
    const ids = new Set(BUILT_IN_TUNINGS.map((t) => t.id));
    expect(ids.size).toBe(BUILT_IN_TUNINGS.length);
    for (const t of BUILT_IN_TUNINGS) {
      expect(isValidTuningShape(t.instrument, t.notes), t.id).toBe(true);
      expect(t.builtIn).toBe(true);
    }
  });

  it('has a standard tuning, listed first, for every combination', () => {
    for (const instrument of ['guitar', 'bass'] as const) {
      for (const strings of STRING_COUNTS[instrument]) {
        const list = tuningsFor(BUILT_IN_TUNINGS, instrument, strings);
        expect(list[0]).toBe(standardFor(instrument, strings));
        expect(list[0].notes).toHaveLength(strings);
      }
    }
  });

  it('includes the two-steps-down presets', () => {
    expect(findTuning(BUILT_IN_TUNINGS, 'guitar-6-two-down').notes.join(' ')).toBe(
      'C2 F2 A#2 D#3 G3 C4',
    );
    expect(findTuning(BUILT_IN_TUNINGS, 'bass-4-two-down').notes.join(' ')).toBe('C1 F1 A#1 D#2');
  });

  it('falls back to guitar 6 standard for an unknown id', () => {
    expect(findTuning(BUILT_IN_TUNINGS, 'deleted-id').id).toBe(DEFAULT_TUNING_ID);
  });

  it('rejects invalid shapes', () => {
    expect(isValidTuningShape('guitar', ['E2', 'A2', 'D3', 'G3'])).toBe(false); // 4-string guitar
    expect(isValidTuningShape('bass', ['E1', 'A1', 'D2', 'G2', 'C3', 'F3', 'A#3'])).toBe(false);
    expect(isValidTuningShape('ukulele', ['G4', 'C4', 'E4', 'A4'])).toBe(false);
    expect(isValidTuningShape('bass', ['E1', 'A1', 'D2', 'H2'])).toBe(false);
    expect(isValidTuningShape('bass', ['E1', 'A1', 'D2', 'E6'])).toBe(false); // above D6
    expect(isValidTuningShape('bass', ['G#0', 'A1', 'D2', 'G2'])).toBe(false); // below A0
    expect(isValidTuningShape('bass', 'E1 A1 D2 G2')).toBe(false);
    expect(isValidTuningShape('bass', [1, 2, 3, 4])).toBe(false);
  });

  it('validates names', () => {
    expect(isValidName('Mi afinación')).toBe(true);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('x'.repeat(40))).toBe(true);
    expect(isValidName('x'.repeat(41))).toBe(false);
  });
});
