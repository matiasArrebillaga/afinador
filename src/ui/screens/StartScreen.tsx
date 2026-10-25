import type { MicErrorKind } from '../../audio/mic';
import { S } from '../strings';

export function StartScreen({ error, onStart }: { error: MicErrorKind | null; onStart(): void }) {
  return (
    <main class="screen start">
      <button class="start-btn" onClick={onStart} aria-label="start">
        ▶
      </button>
      {error && <p class="error">⚠ {S.micErrors[error]}</p>}
    </main>
  );
}
