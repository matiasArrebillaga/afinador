import { useMemo, useRef, useState } from 'preact/hooks';
import { MicError, startMic, type Mic, type MicErrorKind } from './audio/mic';
import { newTuning } from './music/editor';
import { BUILT_IN_TUNINGS, findTuning, standardFor, type Tuning } from './music/tunings';
import {
  loadSettings,
  loadTunings,
  saveSettings,
  saveTunings,
  type Settings,
} from './state/storage';
import { EditorScreen } from './ui/screens/EditorScreen';
import { DebugScreen } from './ui/screens/DebugScreen';
import { StartScreen } from './ui/screens/StartScreen';
import { TunerScreen } from './ui/screens/TunerScreen';
import { TuningPicker } from './ui/screens/TuningPicker';
import { S } from './ui/strings';
import { useTunerEngine } from './ui/use-tuner';

type Screen = 'tuner' | 'debug';

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [mic, setMic] = useState<Mic | null>(null);
  const [micError, setMicError] = useState<MicErrorKind | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [screen, setScreen] = useState<Screen>('tuner');
  const [pickerOpen, setPickerOpen] = useState(false);
  // Not persisted: a lock only makes sense for the string you are tuning right now.
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const taps = useRef({ count: 0, at: 0 });

  const [userTunings, setUserTunings] = useState(loadTunings);
  const [editing, setEditing] = useState<{ tuning: Tuning; isNew: boolean } | null>(null);
  const tunings = useMemo(() => [...BUILT_IN_TUNINGS, ...userTunings], [userTunings]);
  const tuning = findTuning(tunings, settings.activeTuningId);
  const { frame, view, confirmed, engine } = useTunerEngine(mic, tuning, settings, lockedIndex);

  function updateSettings(patch: Partial<Settings>) {
    if ('activeTuningId' in patch || 'mode' in patch) setLockedIndex(null);
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function persistTunings(next: Tuning[]) {
    setUserTunings(next);
    saveTunings(next);
  }

  function openEditor(t: Tuning, isNew: boolean) {
    setPickerOpen(false);
    setEditing({ tuning: t, isNew });
  }

  function cancelEditor() {
    setEditing(null);
    setPickerOpen(true);
  }

  function saveEdited(t: Tuning) {
    persistTunings(
      editing?.isNew ? [...userTunings, t] : userTunings.map((u) => (u.id === t.id ? t : u)),
    );
    updateSettings({ activeTuningId: t.id, mode: 'auto' });
    setEditing(null);
  }

  function deleteEdited() {
    if (!editing) return;
    const gone = editing.tuning;
    persistTunings(userTunings.filter((u) => u.id !== gone.id));
    if (settings.activeTuningId === gone.id) {
      updateSettings({ activeTuningId: standardFor(gone.instrument, gone.notes.length).id });
    }
    cancelEditor();
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
  if (editing) {
    return (
      <EditorScreen
        initial={editing.tuning}
        naming={settings.noteNaming}
        onSave={saveEdited}
        onDelete={editing.isNew ? undefined : deleteEdited}
        onCancel={cancelEditor}
      />
    );
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
        a4={settings.a4}
        confirmed={confirmed}
        lockedIndex={lockedIndex}
        onLock={setLockedIndex}
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
        a4={settings.a4}
        onA4={(a4) => updateSettings({ a4 })}
        onChromatic={() => {
          updateSettings({ mode: 'chromatic' });
          closeSoon();
        }}
        onClose={() => setPickerOpen(false)}
        onNew={(instrument, strings) =>
          openEditor(newTuning(tuning, instrument, strings, S.editor.defaultName), true)
        }
        onEdit={(t) => openEditor(t, false)}
      />
    </>
  );
}
