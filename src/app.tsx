import { useRef, useState } from 'preact/hooks';
import { MicError, startMic, type Mic, type MicErrorKind } from './audio/mic';
import { BUILT_IN_TUNINGS, findTuning } from './music/tunings';
import { loadSettings, saveSettings, type Settings } from './state/storage';
import { DebugScreen } from './ui/screens/DebugScreen';
import { StartScreen } from './ui/screens/StartScreen';
import { TunerScreen } from './ui/screens/TunerScreen';
import { TuningPicker } from './ui/screens/TuningPicker';
import { useTunerEngine } from './ui/use-tuner';

type Screen = 'tuner' | 'debug';

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [mic, setMic] = useState<Mic | null>(null);
  const [micError, setMicError] = useState<MicErrorKind | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [screen, setScreen] = useState<Screen>('tuner');
  const [pickerOpen, setPickerOpen] = useState(false);
  const taps = useRef({ count: 0, at: 0 });

  const tunings = BUILT_IN_TUNINGS;
  const tuning = findTuning(tunings, settings.activeTuningId);
  const { frame, view, confirmed, engine } = useTunerEngine(mic, tuning, settings, 0);

  function updateSettings(patch: Partial<Settings>) {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }

  async function start() {
    try {
      const m = await startMic();
      m.context.onstatechange = () => setSuspended(m.context.state !== 'running');
      setMic(m);
    } catch (e) {
      setMicError(e instanceof MicError ? e.kind : 'unknown');
    }
  }

  function onTitleTap() {
    const now = Date.now();
    const t = taps.current;
    t.count = now - t.at < 600 ? t.count + 1 : 1;
    t.at = now;
    if (t.count >= 5) {
      t.count = 0;
      setScreen('debug');
    }
  }

  if (!mic) return <StartScreen error={micError} onStart={start} />;

  if (screen === 'debug') {
    return <DebugScreen frame={frame} engine={engine.current} onClose={() => setScreen('tuner')} />;
  }
  // Short pause so the selected dot lands before the sheet slides away.
  const closeSoon = () => setTimeout(() => setPickerOpen(false), 160);
  return (
    <>
      <TunerScreen
        view={view}
        tuning={tuning}
        chromatic={settings.mode === 'chromatic'}
        naming={settings.noteNaming}
        confirmed={confirmed}
        suspended={suspended}
        onResume={() => void mic.context.resume()}
        onOpenPicker={() => setPickerOpen(true)}
        onTitleTap={onTitleTap}
      />
      <TuningPicker
        open={pickerOpen}
        tunings={tunings}
        activeId={tuning.id}
        chromatic={settings.mode === 'chromatic'}
        naming={settings.noteNaming}
        onSelect={(id) => {
          updateSettings({ activeTuningId: id, mode: 'auto' });
          closeSoon();
        }}
        onChromatic={() => {
          updateSettings({ mode: 'chromatic' });
          closeSoon();
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
