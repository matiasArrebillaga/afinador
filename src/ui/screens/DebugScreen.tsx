import { useState } from 'preact/hooks';
import type { Engine, EngineFrame } from '../../audio/engine';
import { DEFAULT_RMS_THRESHOLD } from '../../audio/pitch';

interface Props {
  frame: EngineFrame | null;
  engine: Engine | null;
  onClose?(): void;
}

export function DebugScreen({ frame, engine, onClose }: Props) {
  const [gate, setGate] = useState(engine?.rmsThreshold ?? DEFAULT_RMS_THRESHOLD);
  const lines = frame
    ? [
        `raw  ${frame.raw.freq.toFixed(2)} Hz`,
        `clar ${frame.raw.clarity.toFixed(3)}`,
        `rms  ${frame.raw.rms.toFixed(4)}`,
        `smth ${frame.freq?.toFixed(2) ?? '-'} Hz`,
        `win  ${frame.windowSize}`,
        `sr   ${frame.sampleRate}`,
      ]
    : ['no audio'];
  return (
    <main class="screen debug">
      {onClose && (
        <button onClick={onClose} aria-label="close">
          ✕
        </button>
      )}
      <pre>{lines.join('\n')}</pre>
      <label>
        rms gate {gate.toFixed(3)}
        <input
          type="range"
          min="0"
          max="0.05"
          step="0.001"
          value={gate}
          onInput={(e) => {
            const v = Number(e.currentTarget.value);
            setGate(v);
            if (engine) engine.rmsThreshold = v;
          }}
        />
      </label>
    </main>
  );
}
