// harmonics[k] is the amplitude of harmonic k+1 (fundamental first).
export function tone(
  freq: number,
  size: number,
  sampleRate = 48000,
  harmonics: number[] = [1],
): Float32Array {
  const out = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let v = 0;
    harmonics.forEach((amp, k) => {
      v += amp * Math.sin((2 * Math.PI * freq * (k + 1) * i) / sampleRate);
    });
    out[i] = 0.3 * v;
  }
  return out;
}
