import { describe, expect, it } from 'vitest';
import { blankTuning, copyTuning, newTuning, shiftNote } from '../src/music/editor';
import { BUILT_IN_TUNINGS } from '../src/music/tunings';

describe('editor', () => {
  it('shifts notes by semitones', () => {
    expect(shiftNote('E2', -1)).toBe('D#2');
    expect(shiftNote('B1', 1)).toBe('C2');
    expect(shiftNote('E2', -2)).toBe('D2');
  });

  it('never leaves A0–D6', () => {
    expect(shiftNote('A0', -1)).toBe('A0');
    expect(shiftNote('D6', 1)).toBe('D6');
  });

  it('copies a tuning as a new user tuning', () => {
    const base = BUILT_IN_TUNINGS[0];
    const copy = copyTuning(base, 'Mía');
    expect(copy).toMatchObject({ name: 'Mía', instrument: 'guitar', builtIn: false });
    expect(copy.id).not.toBe(base.id);
    expect(copy.notes).toEqual(base.notes);
    expect(copy.notes).not.toBe(base.notes);
  });

  it('starts from the standard tuning of the combination', () => {
    expect(blankTuning('bass', 5, 'Nueva').notes).toEqual(['B0', 'E1', 'A1', 'D2', 'G2']);
  });

  it('new copies the active tuning only when it fits the combination', () => {
    const dropD = BUILT_IN_TUNINGS.find((t) => t.id === 'guitar-6-drop-d')!;
    expect(newTuning(dropD, 'guitar', 6, 'Nueva').notes).toEqual(dropD.notes);
    expect(newTuning(dropD, 'guitar', 7, 'Nueva').notes[0]).toBe('B1');
    expect(newTuning(dropD, 'bass', 4, 'Nueva').notes[0]).toBe('E1');
  });
});
