import { describe, expect, it } from 'vitest';
import {
  MAX_MIDI,
  MIN_MIDI,
  cents,
  displayNote,
  freqToMidi,
  midiToFreq,
  midiToNote,
  noteToFreq,
  noteToMidi,
} from '../src/music/notes';

describe('notes', () => {
  it('A4 is MIDI 69 at 440 Hz', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(midiToFreq(69)).toBe(440);
    expect(freqToMidi(440)).toBe(69);
  });

  it('computes control frequencies', () => {
    expect(noteToFreq('E2')).toBeCloseTo(82.41, 2);
    expect(noteToFreq('A2')).toBeCloseTo(110.0, 2);
    expect(noteToFreq('E4')).toBeCloseTo(329.63, 2);
    expect(noteToFreq('E1')).toBeCloseTo(41.2, 2);
    expect(noteToFreq('B0')).toBeCloseTo(30.87, 2);
  });

  it('respects a custom A4', () => {
    expect(noteToFreq('A4', 432)).toBe(432);
  });

  it('round-trips every note in the editor range', () => {
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
      expect(noteToMidi(midiToNote(midi))).toBe(midi);
    }
    expect(midiToNote(MIN_MIDI)).toBe('A0');
    expect(midiToNote(MAX_MIDI)).toBe('D6');
  });

  it('rejects invalid names', () => {
    for (const bad of ['', 'H2', 'E#2', 'e2', 'Eb2', 'E', 'E10', 'A#']) {
      expect(noteToMidi(bad)).toBeNull();
    }
    expect(() => noteToFreq('H2')).toThrow();
  });

  it('measures cents', () => {
    expect(cents(440, 440)).toBe(0);
    expect(cents(440 * 2 ** (1 / 12), 440)).toBeCloseTo(100, 6);
    expect(cents(220, 440)).toBeCloseTo(-1200, 6);
  });

  it('displays in English or Spanish', () => {
    expect(displayNote('C#3', 'en')).toBe('C#3');
    expect(displayNote('C#3', 'es')).toBe('Do#3');
    expect(displayNote('G2', 'es')).toBe('Sol2');
    expect(displayNote('B0', 'es')).toBe('Si0');
  });
});
