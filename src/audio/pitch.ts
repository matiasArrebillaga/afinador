import { PitchDetector } from 'pitchy';

export interface PitchReading {
  freq: number;
  clarity: number;
  rms: number;
}

export type Detect = (buf: Float32Array, sampleRate: number) => PitchReading;
export type WindowSize = 2048 | 4096 | 8192;

export const MIN_FREQ = 25;
export const MAX_FREQ = 1200;
export const MIN_CLARITY = 0.9;
export const DEFAULT_RMS_THRESHOLD = 0.01;

export function windowSizeFor(lowestFreq: number | null): WindowSize {
  if (lowestFreq === null) return 4096;
  if (lowestFreq < 60) return 8192;
  if (lowestFreq < 100) return 4096;
  return 2048;
}

export function rms(buf: Float32Array): number {
  let sum = 0;
  for (const v of buf) sum += v * v;
  return Math.sqrt(sum / buf.length);
}

export function createDetector(size: number): Detect {
  const detector = PitchDetector.forFloat32Array(size);
  return (buf, sampleRate) => {
    const [freq, clarity] = detector.findPitch(buf, sampleRate);
    return { freq, clarity, rms: rms(buf) };
  };
}

export function isUsable(r: PitchReading, rmsThreshold: number): boolean {
  return (
    r.rms >= rmsThreshold && r.clarity >= MIN_CLARITY && r.freq >= MIN_FREQ && r.freq <= MAX_FREQ
  );
}
