import { A4_DEFAULT, A4_MAX, A4_MIN, type NoteNaming } from '../music/notes';
import type { Mode } from '../music/tuner';
import { DEFAULT_TUNING_ID, isValidName, isValidTuningShape, type Tuning } from '../music/tunings';

export interface Settings {
  a4: number;
  activeTuningId: string;
  mode: Mode;
  inTuneThresholdCents: number;
  noteNaming: NoteNaming;
}

export const DEFAULT_SETTINGS: Settings = {
  a4: A4_DEFAULT,
  activeTuningId: DEFAULT_TUNING_ID,
  mode: 'auto',
  inTuneThresholdCents: 3,
  noteNaming: 'en',
};

const VERSION = 1;
const SETTINGS_KEY = 'afinador:settings';

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === VERSION ? parsed.data : null;
  } catch {
    return null;
  }
}

function write(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ version: VERSION, data }));
  } catch {
    // Blocked or full storage: the app keeps working with in-memory state.
  }
}

function sanitizeSettings(d: Record<string, unknown>): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (typeof d.a4 === 'number' && d.a4 >= A4_MIN && d.a4 <= A4_MAX) s.a4 = d.a4;
  if (typeof d.activeTuningId === 'string') s.activeTuningId = d.activeTuningId;
  if (d.mode === 'auto' || d.mode === 'manual' || d.mode === 'chromatic') s.mode = d.mode;
  if (
    typeof d.inTuneThresholdCents === 'number' &&
    d.inTuneThresholdCents > 0 &&
    d.inTuneThresholdCents <= 10
  ) {
    s.inTuneThresholdCents = d.inTuneThresholdCents;
  }
  if (d.noteNaming === 'en' || d.noteNaming === 'es') s.noteNaming = d.noteNaming;
  return s;
}

export function loadSettings(): Settings {
  const d = read(SETTINGS_KEY);
  return d && typeof d === 'object'
    ? sanitizeSettings(d as Record<string, unknown>)
    : { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, s);
}

const TUNINGS_KEY = 'afinador:tunings';

function isStoredTuning(t: unknown): t is Tuning {
  if (!t || typeof t !== 'object') return false;
  const r = t as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    isValidName(r.name) &&
    isValidTuningShape(r.instrument, r.notes)
  );
}

export function loadTunings(): Tuning[] {
  const d = read(TUNINGS_KEY);
  if (!Array.isArray(d)) return [];
  return d.filter(isStoredTuning).map((t) => ({
    id: t.id,
    name: t.name,
    instrument: t.instrument,
    notes: [...t.notes],
    builtIn: false,
  }));
}

export function saveTunings(tunings: readonly Tuning[]): void {
  write(TUNINGS_KEY, tunings);
}
