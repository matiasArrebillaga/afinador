import { useRef, useState } from 'preact/hooks';
import { Engine, type EngineFrame } from './audio/engine';
import { MicError, startMic, type MicErrorKind } from './audio/mic';
import { DebugScreen } from './ui/screens/DebugScreen';
import { StartScreen } from './ui/screens/StartScreen';

export function App() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<MicErrorKind | null>(null);
  const [frame, setFrame] = useState<EngineFrame | null>(null);
  const engine = useRef<Engine | null>(null);

  async function start() {
    try {
      const mic = await startMic();
      engine.current = new Engine(mic, setFrame, 8192);
      engine.current.start();
      setRunning(true);
    } catch (e) {
      setError(e instanceof MicError ? e.kind : 'unknown');
    }
  }

  if (!running) return <StartScreen error={error} onStart={start} />;
  return <DebugScreen frame={frame} engine={engine.current} />;
}
