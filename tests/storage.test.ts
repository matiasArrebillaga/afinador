import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  loadTunings,
  saveSettings,
  saveTunings,
} from '../src/state/storage';
import { fakeStorage } from './helpers/storage';

describe('settings storage', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips', () => {
    const s = { ...DEFAULT_SETTINGS, a4: 432, activeTuningId: 'bass-4-standard' };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it('falls back on corrupt JSON or another version', () => {
    localStorage.setItem('afinador:settings', '{oops');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem('afinador:settings', JSON.stringify({ version: 99, data: { a4: 432 } }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces each invalid field with its default', () => {
    localStorage.setItem(
      'afinador:settings',
      JSON.stringify({
        version: 1,
        data: {
          a4: 9999,
          mode: 'loud',
          noteNaming: 'fr',
          inTuneThresholdCents: 'x',
          activeTuningId: 5,
        },
      }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('survives a blocked localStorage', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
  });
});

describe('tunings storage', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  const mine = {
    id: 'u1',
    name: 'Mía',
    instrument: 'guitar' as const,
    notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'],
    builtIn: false,
  };

  it('starts empty and round-trips', () => {
    expect(loadTunings()).toEqual([]);
    saveTunings([mine]);
    expect(loadTunings()).toEqual([mine]);
  });

  it('drops invalid entries and forces builtIn false', () => {
    localStorage.setItem(
      'afinador:tunings',
      JSON.stringify({
        version: 1,
        data: [
          { ...mine, builtIn: true },
          { ...mine, id: 'u2', notes: ['C2'] },
          { ...mine, id: 'u3', name: 'x'.repeat(41) },
          'garbage',
        ],
      }),
    );
    expect(loadTunings()).toEqual([mine]);
  });

  it('survives a blocked localStorage', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom });
    expect(loadTunings()).toEqual([]);
    expect(() => saveTunings([mine])).not.toThrow();
  });
});
