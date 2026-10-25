export type NoteNaming = 'en' | 'es';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PITCH_CLASSES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export const MIN_MIDI = 21; // A0
export const MAX_MIDI = 86; // D6
export const A4_DEFAULT = 440;
export const A4_MIN = 415;
export const A4_MAX = 466;

export function noteToMidi(note: string): number | null {
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) return null;
  const pitchClass = PITCH_CLASSES.indexOf(match[1]);
  if (pitchClass < 0) return null;
  return (Number(match[2]) + 1) * 12 + pitchClass;
}

export function midiToNote(midi: number): string {
  return `${PITCH_CLASSES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function midiToFreq(midi: number, a4 = A4_DEFAULT): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

export function freqToMidi(freq: number, a4 = A4_DEFAULT): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export function noteToFreq(note: string, a4 = A4_DEFAULT): number {
  const midi = noteToMidi(note);
  if (midi === null) throw new Error(`Invalid note: ${note}`);
  return midiToFreq(midi, a4);
}

export function cents(detected: number, target: number): number {
  return 1200 * Math.log2(detected / target);
}

export function displayNote(note: string, naming: NoteNaming): string {
  const midi = noteToMidi(note);
  if (naming === 'en' || midi === null) return note;
  return `${PITCH_CLASSES_ES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
