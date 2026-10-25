import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Engine, type EngineFrame } from '../audio/engine';
import type { Mic } from '../audio/mic';
import { windowSizeFor, type WindowSize } from '../audio/pitch';
import { noteToFreq } from '../music/notes';
import { Tuner, type TunerConfig, type TunerView } from '../music/tuner';
import type { Tuning } from '../music/tunings';
import type { Settings } from '../state/storage';

function tunerConfig(tuning: Tuning, settings: Settings, lockedIndex: number | null): TunerConfig {
  const locked = lockedIndex !== null && settings.mode !== 'chromatic';
  return {
    notes: tuning.notes,
    a4: settings.a4,
    mode: locked ? 'manual' : settings.mode,
    manualIndex: lockedIndex ?? 0,
    thresholdCents: settings.inTuneThresholdCents,
  };
}

export function targetFreq(tuning: Tuning, settings: Settings, lockedIndex: number | null) {
  if (lockedIndex === null || settings.mode === 'chromatic') return null;
  return noteToFreq(tuning.notes[lockedIndex], settings.a4);
}

// A locked string only needs a window long enough for its own note, so high strings react faster.
export function windowFor(
  tuning: Tuning,
  settings: Settings,
  lockedIndex: number | null,
): WindowSize {
  if (settings.mode === 'chromatic') return windowSizeFor(null);
  const lowest = Math.min(...tuning.notes.map((n) => noteToFreq(n, settings.a4)));
  return windowSizeFor(targetFreq(tuning, settings, lockedIndex) ?? lowest);
}

export function useTunerEngine(
  mic: Mic | null,
  tuning: Tuning,
  settings: Settings,
  lockedIndex: number | null,
) {
  const [frame, setFrame] = useState<EngineFrame | null>(null);
  const [view, setView] = useState<TunerView | null>(null);
  const tuner = useMemo(() => new Tuner(tunerConfig(tuning, settings, lockedIndex)), []);
  const engine = useRef<Engine | null>(null);

  useEffect(() => {
    tuner.configure(tunerConfig(tuning, settings, lockedIndex));
    if (!engine.current) return;
    engine.current.setWindowSize(windowFor(tuning, settings, lockedIndex));
    engine.current.target = targetFreq(tuning, settings, lockedIndex);
  }, [tuning, settings, lockedIndex]);

  useEffect(() => {
    if (!mic) return;
    const e = new Engine(
      mic,
      (f) => {
        setFrame(f);
        setView(tuner.update(f.freq, performance.now()));
      },
      windowFor(tuning, settings, lockedIndex),
    );
    e.target = targetFreq(tuning, settings, lockedIndex);
    engine.current = e;
    e.start();
    return () => {
      e.stop();
      engine.current = null;
    };
  }, [mic]);

  return { frame, view, confirmed: tuner.confirmed as ReadonlySet<number>, engine };
}
