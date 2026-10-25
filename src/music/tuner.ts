import { OUT_OF_RANGE_CENTS, matchChromatic, matchIndex, matchString, type Match } from './matcher';

export type Mode = 'auto' | 'manual' | 'chromatic';

export interface TunerConfig {
  notes: readonly string[];
  a4: number;
  mode: Mode;
  manualIndex: number;
  thresholdCents: number;
}

export interface TunerView {
  freq: number;
  note: string;
  cents: number;
  stringIndex: number; // -1 in chromatic mode
  outOfRange: boolean;
  inTune: boolean;
}

export const EXIT_EXTRA_CENTS = 2;
export const CONFIRM_MS = 500;

export class Tuner {
  readonly confirmed = new Set<number>();
  private inTune = false;
  private strictSince: number | null = null;
  private lastIndex: number | null = null;

  constructor(private config: TunerConfig) {}

  configure(config: TunerConfig): void {
    if (config.notes.join(' ') !== this.config.notes.join(' ')) this.confirmed.clear();
    this.config = config;
    this.resetTracking();
  }

  update(freq: number | null, now: number): TunerView | null {
    if (freq === null) {
      this.resetTracking();
      return null;
    }
    const match = this.match(freq);
    if (match.index !== this.lastIndex) {
      this.resetTracking();
      this.lastIndex = match.index;
    }

    const abs = Math.abs(match.cents);
    const { thresholdCents, a4 } = this.config;
    if (abs <= thresholdCents) {
      this.inTune = true;
      this.strictSince ??= now;
    } else {
      this.strictSince = null;
      if (abs > thresholdCents + EXIT_EXTRA_CENTS) this.inTune = false;
    }
    if (match.index >= 0 && this.strictSince !== null && now - this.strictSince >= CONFIRM_MS) {
      this.confirmed.add(match.index);
    }

    const outOfRange = abs > OUT_OF_RANGE_CENTS;
    return {
      freq,
      note: outOfRange ? matchChromatic(freq, a4).note : match.note,
      cents: match.cents,
      stringIndex: match.index,
      outOfRange,
      inTune: this.inTune,
    };
  }

  private match(freq: number): Match {
    const { notes, a4, mode, manualIndex } = this.config;
    if (mode === 'chromatic') return matchChromatic(freq, a4);
    if (mode === 'manual') return matchIndex(freq, notes, manualIndex, a4);
    return matchString(freq, notes, a4);
  }

  private resetTracking(): void {
    this.inTune = false;
    this.strictSince = null;
    this.lastIndex = null;
  }
}
