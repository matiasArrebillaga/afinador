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

function windowFor(tuning: Tuning, settings: Settings): WindowSize {
  if (settings.mode === 'chromatic') return windowSizeFor(null);
  return windowSizeFor(Math.min(...tuning.notes.map((n) => noteToFreq(n, settings.a4))));
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
    engine.current?.setWindowSize(windowFor(tuning, settings));
  }, [tuning, settings, lockedIndex]);

  useEffect(() => {
    if (!mic) return;
    const e = new Engine(
      mic,
      (f) => {
        setFrame(f);
        setView(tuner.update(f.freq, performance.now()));
      },
      windowFor(tuning, settings),
    );
    engine.current = e;
    e.start();
    return () => {
      e.stop();
      engine.current = null;
    };
  }, [mic]);

  return { frame, view, confirmed: tuner.confirmed as ReadonlySet<number>, engine };
}
