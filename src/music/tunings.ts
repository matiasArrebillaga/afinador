import { MAX_MIDI, MIN_MIDI, noteToMidi } from './notes';

export type Instrument = 'guitar' | 'bass';

export const STRING_COUNTS: Record<Instrument, readonly number[]> = {
  guitar: [6, 7, 8],
  bass: [4, 5, 6],
};

export interface Tuning {
  id: string;
  name: string;
  instrument: Instrument;
  notes: string[]; // low → high
  builtIn: boolean;
}

function preset(instrument: Instrument, slug: string, name: string, notes: string): Tuning {
  const list = notes.split(' ');
  return { id: `${instrument}-${list.length}-${slug}`, name, instrument, notes: list, builtIn: true };
}

// The first tuning of every instrument/string-count combination must be its standard one.
export const BUILT_IN_TUNINGS: readonly Tuning[] = [
  preset('guitar', 'standard', 'Standard', 'E2 A2 D3 G3 B3 E4'),
  preset('guitar', 'drop-d', 'Drop D', 'D2 A2 D3 G3 B3 E4'),
  preset('guitar', 'half-down', 'Half step down', 'D#2 G#2 C#3 F#3 A#3 D#4'),
  preset('guitar', 'whole-down', 'Whole step down', 'D2 G2 C3 F3 A3 D4'),
  preset('guitar', 'two-down', 'Two steps down', 'C2 F2 A#2 D#3 G3 C4'),
  preset('guitar', 'drop-c', 'Drop C', 'C2 G2 C3 F3 A3 D4'),
  preset('guitar', 'dadgad', 'DADGAD', 'D2 A2 D3 G3 A3 D4'),
  preset('guitar', 'open-g', 'Open G', 'D2 G2 D3 G3 B3 D4'),
  preset('guitar', 'open-d', 'Open D', 'D2 A2 D3 F#3 A3 D4'),
  preset('guitar', 'standard', 'Standard', 'B1 E2 A2 D3 G3 B3 E4'),
  preset('guitar', 'drop-a', 'Drop A', 'A1 E2 A2 D3 G3 B3 E4'),
  preset('guitar', 'standard', 'Standard', 'F#1 B1 E2 A2 D3 G3 B3 E4'),
  preset('guitar', 'drop-e', 'Drop E', 'E1 B1 E2 A2 D3 G3 B3 E4'),
  preset('bass', 'standard', 'Standard', 'E1 A1 D2 G2'),
  preset('bass', 'drop-d', 'Drop D', 'D1 A1 D2 G2'),
  preset('bass', 'two-down', 'Two steps down', 'C1 F1 A#1 D#2'),
  preset('bass', 'standard', 'Standard', 'B0 E1 A1 D2 G2'),
  preset('bass', 'standard', 'Standard', 'B0 E1 A1 D2 G2 C3'),
];

export const DEFAULT_TUNING_ID = 'guitar-6-standard';
export const MAX_NAME = 40;

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME;
}

export function isValidTuningShape(instrument: unknown, notes: unknown): boolean {
  if (instrument !== 'guitar' && instrument !== 'bass') return false;
  if (!Array.isArray(notes) || !STRING_COUNTS[instrument].includes(notes.length)) return false;
  return notes.every((note) => {
    if (typeof note !== 'string') return false;
    const midi = noteToMidi(note);
    return midi !== null && midi >= MIN_MIDI && midi <= MAX_MIDI;
  });
}

export function tuningsFor(
  all: readonly Tuning[],
  instrument: Instrument,
  strings: number,
): Tuning[] {
  return all.filter((t) => t.instrument === instrument && t.notes.length === strings);
}

export function standardFor(instrument: Instrument, strings: number): Tuning {
  return BUILT_IN_TUNINGS.find((t) => t.id === `${instrument}-${strings}-standard`)!;
}

export function findTuning(all: readonly Tuning[], id: string): Tuning {
  return all.find((t) => t.id === id) ?? BUILT_IN_TUNINGS.find((t) => t.id === DEFAULT_TUNING_ID)!;
}
