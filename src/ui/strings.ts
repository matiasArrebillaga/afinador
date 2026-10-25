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
  kinds: { guitar: 'Guitarra', bass: 'Bajo', chromatic: 'Cromático' },
  locked: 'fijada',
  picker: {
    title: 'Afinación',
    strings: 'Cuerdas',
    chromaticHint: 'Detecta cualquier nota, sin afinación de referencia.',
    a4: 'La4',
    a4Reset: 'Volver a 440 Hz',
    newTuning: '+ Nueva',
    edit: 'Editar',
  },
  editor: {
    name: 'Nombre',
    defaultName: 'Mi afinación',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Borrar',
    confirmDelete: '¿Borrar? Tocá de nuevo',
    up: 'Subir un semitono, cuerda',
    down: 'Bajar un semitono, cuerda',
  },
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
  kinds: { guitar: 'Guitar', bass: 'Bass', chromatic: 'Chromatic' },
  locked: 'locked',
  picker: {
    title: 'Tuning',
    strings: 'Strings',
    chromaticHint: 'Detects any note, no reference tuning.',
    a4: 'A4',
    a4Reset: 'Reset to 440 Hz',
    newTuning: '+ New',
    edit: 'Edit',
  },
  editor: {
    name: 'Name',
    defaultName: 'My tuning',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Delete? Tap again',
    up: 'Semitone up, string',
    down: 'Semitone down, string',
  },
  tuningNames: {},
};

export const S = navigator.language.toLowerCase().startsWith('es') ? es : en;

export function tuningLabel(t: Tuning): string {
  return t.builtIn ? (S.tuningNames[t.name] ?? t.name) : t.name;
}
