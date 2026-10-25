import { PitchDetector } from 'pitchy';
import { cents } from '../music/notes';

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
// With a locked string the target filters out noise, so weaker attacks and tails can count.
// ponytail: 0.8 is a guess; tune it from the debug screen on real phones.
export const LOCKED_MIN_CLARITY = 0.8;
const LOCKED_RANGE_CENTS = 400;
export const DEFAULT_RMS_THRESHOLD = 0.002; // measured: silence ~0.0002, string ~0.02

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

function nearTarget(freq: number, target: number): boolean {
  const c = cents(freq, target);
  // The octave above counts too: phone mics often only catch a low string's 2nd harmonic.
  return Math.abs(c) <= LOCKED_RANGE_CENTS || Math.abs(c - 1200) <= LOCKED_RANGE_CENTS;
}

export function isUsable(
  r: PitchReading,
  rmsThreshold: number,
  target: number | null = null,
): boolean {
  if (r.rms < rmsThreshold || r.freq < MIN_FREQ || r.freq > MAX_FREQ) return false;
  if (target === null) return r.clarity >= MIN_CLARITY;
  return r.clarity >= LOCKED_MIN_CLARITY && nearTarget(r.freq, target);
}
