import {
  DEFAULT_RMS_THRESHOLD,
  createDetector,
  isUsable,
  type Detect,
  type PitchReading,
  type WindowSize,
} from './pitch';
import { Smoother } from './smoothing';

export interface AudioSource {
  sampleRate: number;
  read(size: number): Float32Array;
}

export interface EngineFrame {
  raw: PitchReading;
  freq: number | null; // smoothed; null = idle
  windowSize: number;
  sampleRate: number;
}

export const FRAME_MS = 40;

export class Engine {
  rmsThreshold = DEFAULT_RMS_THRESHOLD;
  private detect: Detect;
  private smoother = new Smoother();
  private timer: ReturnType<typeof setInterval> | undefined;
  private paused = false;

  constructor(
    private readonly source: AudioSource,
    private readonly onFrame: (frame: EngineFrame) => void,
    private size: WindowSize = 2048,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.detect = createDetector(size);
  }

  start(): void {
    this.timer ??= setInterval(() => this.tick(), FRAME_MS);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  setWindowSize(size: WindowSize): void {
    if (size === this.size) return;
    this.size = size;
    this.detect = createDetector(size);
    this.smoother.reset();
  }

  pause(): void {
    this.paused = true;
    this.smoother.reset();
  }

  resume(): void {
    this.paused = false;
  }

  tick(): void {
    if (this.paused) return;
    const raw = this.detect(this.source.read(this.size), this.source.sampleRate);
    const t = this.now();
    const freq = isUsable(raw, this.rmsThreshold)
      ? this.smoother.push(raw.freq, t)
      : this.smoother.current(t);
    this.onFrame({ raw, freq, windowSize: this.size, sampleRate: this.source.sampleRate });
  }
}
