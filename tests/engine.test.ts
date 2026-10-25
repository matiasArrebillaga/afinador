import { describe, expect, it } from 'vitest';
import { Engine, type AudioSource, type EngineFrame } from '../src/audio/engine';
import { tone } from './helpers/signal';

class FakeSource implements AudioSource {
  sampleRate = 48000;
  requested: number[] = [];
  constructor(public freq: number | null) {}
  read(size: number): Float32Array {
    this.requested.push(size);
    return this.freq === null ? new Float32Array(size) : tone(this.freq, size, this.sampleRate);
  }
}

function setup(freq: number | null) {
  const source = new FakeSource(freq);
  const frames: EngineFrame[] = [];
  const clock = { t: 0 };
  const engine = new Engine(source, (f) => frames.push(f), 2048, () => clock.t);
  return { source, frames, clock, engine };
}

describe('Engine', () => {
  it('emits the smoothed frequency', () => {
    const { frames, engine } = setup(110);
    engine.tick();
    expect(frames[0].freq).toBeCloseTo(110, 0);
    expect(frames[0].windowSize).toBe(2048);
  });

  it('switches window size when the tuning changes (guitar → bass)', () => {
    const { source, frames, engine } = setup(110);
    engine.tick();
    source.freq = 41.2;
    engine.setWindowSize(8192);
    engine.tick();
    expect(source.requested.at(-1)).toBe(8192);
    expect(frames.at(-1)!.windowSize).toBe(8192);
    expect(frames.at(-1)!.freq).toBeCloseTo(41.2, 0); // no leftover 110 Hz readings
  });

  it('emits nothing while paused (reference tone playing)', () => {
    const { frames, engine } = setup(110);
    engine.pause();
    engine.tick();
    expect(frames).toHaveLength(0);
    engine.resume();
    engine.tick();
    expect(frames).toHaveLength(1);
  });

  it('holds the value during silence, then reports null', () => {
    const { source, frames, clock, engine } = setup(110);
    engine.tick();
    source.freq = null;
    clock.t = 500;
    engine.tick();
    expect(frames.at(-1)!.freq).toBeCloseTo(110, 0);
    clock.t = 1600;
    engine.tick();
    expect(frames.at(-1)!.freq).toBeNull();
  });
});
