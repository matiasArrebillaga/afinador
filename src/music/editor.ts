import { MAX_MIDI, MIN_MIDI, midiToNote, noteToMidi } from './notes';
import { standardFor, type Instrument, type Tuning } from './tunings';

export function shiftNote(note: string, semitones: number): string {
  const midi = noteToMidi(note);
  if (midi === null) return note;
  const next = midi + semitones;
  return next < MIN_MIDI || next > MAX_MIDI ? note : midiToNote(next);
}

export function copyTuning(base: Tuning, name: string): Tuning {
  return {
    id: crypto.randomUUID(),
    name,
    instrument: base.instrument,
    notes: [...base.notes],
    builtIn: false,
  };
}

export function blankTuning(instrument: Instrument, strings: number, name: string): Tuning {
  return copyTuning(standardFor(instrument, strings), name);
}

// "+ New" doubles as duplicate: it starts from the active tuning when it fits the list.
export function newTuning(
  active: Tuning,
  instrument: Instrument,
  strings: number,
  name: string,
): Tuning {
  return active.instrument === instrument && active.notes.length === strings
    ? copyTuning(active, name)
    : blankTuning(instrument, strings, name);
}
