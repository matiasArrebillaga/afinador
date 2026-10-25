import type { MicErrorKind } from '../audio/mic';

const es = {
  micErrors: {
    denied: 'Micrófono bloqueado',
    'no-mic': 'Sin micrófono',
    insecure: 'Necesita HTTPS',
    unknown: 'Error de micrófono',
  } satisfies Record<MicErrorKind, string>,
};

const en: typeof es = {
  micErrors: {
    denied: 'Microphone blocked',
    'no-mic': 'No microphone',
    insecure: 'HTTPS required',
    unknown: 'Microphone error',
  },
};

export const S = navigator.language.toLowerCase().startsWith('es') ? es : en;
