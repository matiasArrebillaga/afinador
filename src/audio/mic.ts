import type { AudioSource } from './engine';

export type MicErrorKind = 'denied' | 'no-mic' | 'insecure' | 'unknown';

export class MicError extends Error {
  constructor(readonly kind: MicErrorKind) {
    super(kind);
  }
}

export interface Mic extends AudioSource {
  context: AudioContext;
  close(): Promise<void>;
}

const MAX_WINDOW = 8192;

function errorKind(e: unknown): MicErrorKind {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  return 'unknown';
}

// Call synchronously from a click handler: iOS only unlocks audio for an AudioContext
// created during a user gesture.
export async function startMic(): Promise<Mic> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new MicError('insecure');
  }
  const context = new AudioContext();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    await context.close();
    throw new MicError(errorKind(e));
  }
  await context.resume();

  const analyser = context.createAnalyser();
  analyser.fftSize = MAX_WINDOW;
  analyser.smoothingTimeConstant = 0;
  context.createMediaStreamSource(stream).connect(analyser);
  const buffer = new Float32Array(MAX_WINDOW);

  return {
    context,
    sampleRate: context.sampleRate,
    read(size) {
      analyser.getFloatTimeDomainData(buffer);
      return buffer.subarray(MAX_WINDOW - size); // most recent `size` samples
    },
    async close() {
      stream.getTracks().forEach((t) => t.stop());
      await context.close();
    },
  };
}
