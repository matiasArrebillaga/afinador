import { cents, freqToMidi, midiToFreq, midiToNote, noteToFreq } from './notes';

export interface Match {
  index: number; // -1 in chromatic mode
  note: string;
  targetFreq: number;
  cents: number;
}

export const OUT_OF_RANGE_CENTS = 50;

export function matchIndex(
  freq: number,
  notes: readonly string[],
  index: number,
  a4: number,
): Match {
  const i = Math.max(0, Math.min(index, notes.length - 1));
  const targetFreq = noteToFreq(notes[i], a4);
  return { index: i, note: notes[i], targetFreq, cents: cents(freq, targetFreq) };
}

export function matchString(freq: number, notes: readonly string[], a4: number): Match {
  let best = matchIndex(freq, notes, 0, a4);
  for (let i = 1; i < notes.length; i++) {
    const candidate = matchIndex(freq, notes, i, a4);
    if (Math.abs(candidate.cents) < Math.abs(best.cents)) best = candidate;
  }
  return best;
}

export function matchChromatic(freq: number, a4: number): Match {
  const midi = Math.round(freqToMidi(freq, a4));
  const targetFreq = midiToFreq(midi, a4);
  return { index: -1, note: midiToNote(midi), targetFreq, cents: cents(freq, targetFreq) };
}
