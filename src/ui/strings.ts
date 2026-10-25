import type { MicErrorKind } from '../audio/mic';
import type { Tuning } from '../music/tunings';

const es = {
  micErrors: {
    denied: 'Micrófono bloqueado',
    'no-mic': 'Sin micrófono',
    insecure: 'Necesita HTTPS',
    unknown: 'Error de micrófono',
  } satisfies Record<MicErrorKind, string>,
  status: { inTune: '✓ afinada', up: '↑ tensar', down: '↓ aflojar', far: 'fuera de rango' },
  tuningNames: {
    Standard: 'Estándar',
    'Half step down': 'Medio tono abajo',
    'Whole step down': 'Un tono abajo',
    'Two steps down': 'Dos tonos abajo',
  } as Record<string, string>,
};

const en: typeof es = {
  micErrors: {
    denied: 'Microphone blocked',
    'no-mic': 'No microphone',
    insecure: 'HTTPS required',
    unknown: 'Microphone error',
  },
  status: { inTune: '✓ in tune', up: '↑ tighten', down: '↓ loosen', far: 'out of range' },
  tuningNames: {},
};

export const S = navigator.language.toLowerCase().startsWith('es') ? es : en;

export function tuningLabel(t: Tuning): string {
  return t.builtIn ? (S.tuningNames[t.name] ?? t.name) : t.name;
}
