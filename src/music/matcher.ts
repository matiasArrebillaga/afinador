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
  fold = true,
): Match {
  const i = Math.max(0, Math.min(index, notes.length - 1));
  const targetFreq = noteToFreq(notes[i], a4);
  let c = cents(freq, targetFreq);
  // Phone mics barely pick up low fundamentals, so the detector can lock onto the 2nd
  // harmonic. ponytail: can't tell a real D3 from an octave-up D2 in drop D; needs
  // spectral checks if that matters.
  const folded = cents(freq / 2, targetFreq);
  if (fold && Math.abs(c) > OUT_OF_RANGE_CENTS && Math.abs(folded) <= OUT_OF_RANGE_CENTS) c = folded;
  return { index: i, note: notes[i], targetFreq, cents: c };
}

function nearest(freq: number, notes: readonly string[], a4: number, fold: boolean): Match {
  let best = matchIndex(freq, notes, 0, a4, fold);
  for (let i = 1; i < notes.length; i++) {
    const candidate = matchIndex(freq, notes, i, a4, fold);
    if (Math.abs(candidate.cents) < Math.abs(best.cents)) best = candidate;
  }
  return best;
}

// A direct match always beats an octave-folded one.
export function matchString(freq: number, notes: readonly string[], a4: number): Match {
  const direct = nearest(freq, notes, a4, false);
  return Math.abs(direct.cents) <= OUT_OF_RANGE_CENTS ? direct : nearest(freq, notes, a4, true);
}

export function matchChromatic(freq: number, a4: number): Match {
  const midi = Math.round(freqToMidi(freq, a4));
  const targetFreq = midiToFreq(midi, a4);
  return { index: -1, note: midiToNote(midi), targetFreq, cents: cents(freq, targetFreq) };
}
