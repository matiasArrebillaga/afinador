import { useRef, useState } from 'preact/hooks';
import type { MicErrorKind } from '../../audio/mic';
import { ArcMeter } from '../components/ArcMeter';
import { S } from '../strings';

interface Props {
  error: MicErrorKind | null;
  onStart(): Promise<void>;
}

// The same arc as the tuner: on success the note appears where ▶ was.
export function StartScreen({ error, onStart }: Props) {
  const [leaving, setLeaving] = useState(false);
  // A ref, not state: two taps in the same tick would both see stale state and open two mic streams.
  const busy = useRef(false);
  async function start() {
    if (busy.current) return;
    busy.current = true;
    setLeaving(true);
    await onStart();
    // Only reached visibly when the mic failed; on success this screen is already gone.
    busy.current = false;
    setLeaving(false);
  }
  return (
    <main class="screen start">
      <ArcMeter cents={null}>
        <button
          class={leaving ? 'start-btn leaving' : 'start-btn'}
          onClick={() => void start()}
          aria-label="start"
        >
          ▶
        </button>
      </ArcMeter>
      {error && <p class="error">{S.micErrors[error]}</p>}
    </main>
  );
}
