import { cents } from '../music/notes';

export interface SmootherOptions {
  medianSize: number;
  emaAlpha: number;
  holdMs: number;
  octaveConfirmations: number;
}

const DEFAULTS: SmootherOptions = { medianSize: 5, emaAlpha: 0.3, holdMs: 1000, octaveConfirmations: 3 };
const NEW_NOTE_CENTS = 100;
const OCTAVE_TOLERANCE_CENTS = 50;

export function median(xs: readonly number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isOctaveJump(freq: number, ref: number): boolean {
  return Math.abs(Math.abs(cents(freq, ref)) - 1200) <= OCTAVE_TOLERANCE_CENTS;
}

export class Smoother {
  private history: number[] = [];
  private value: number | null = null;
  private lastAt = -Infinity;
  private octaveStreak = 0;

  constructor(private readonly opts: SmootherOptions = DEFAULTS) {}

  push(freq: number, now: number): number {
    if (this.current(now) === null) this.reset();
    this.lastAt = now;

    if (this.value !== null && isOctaveJump(freq, this.value)) {
      this.octaveStreak++;
      if (this.octaveStreak < this.opts.octaveConfirmations) return this.value;
      this.reset();
    }
    this.octaveStreak = 0;

    this.history.push(freq);
    if (this.history.length > this.opts.medianSize) this.history.shift();
    const m = median(this.history);

    if (this.value === null || Math.abs(cents(m, this.value)) > NEW_NOTE_CENTS) this.value = m;
    else this.value += this.opts.emaAlpha * (m - this.value);
    return this.value;
  }

  current(now: number): number | null {
    if (this.value !== null && now - this.lastAt > this.opts.holdMs) this.reset();
    return this.value;
  }

  reset(): void {
    this.history = [];
    this.value = null;
    this.octaveStreak = 0;
  }
}
