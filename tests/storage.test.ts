import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../src/state/storage';
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
