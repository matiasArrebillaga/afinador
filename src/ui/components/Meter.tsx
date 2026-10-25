const RANGE = 50;
const TICKS = Array.from({ length: 21 }, (_, i) => i * 5 - RANGE);
const LABELS = [-50, -25, 0, 25, 50];
// Hue stops by |cents|: green when in tune, amber mid-way, red far off.
const HUE_STOPS: readonly [number, number][] = [
  [3, 145],
  [15, 40],
  [35, 6],
];

export function meterHue(absCents: number): number {
  if (absCents <= HUE_STOPS[0][0]) return HUE_STOPS[0][1];
  for (let i = 1; i < HUE_STOPS.length; i++) {
    const [a0, h0] = HUE_STOPS[i - 1];
    const [a1, h1] = HUE_STOPS[i];
    if (absCents <= a1) return h0 + ((h1 - h0) * (absCents - a0)) / (a1 - a0);
  }
  return HUE_STOPS[HUE_STOPS.length - 1][1];
}

export function meterColor(cents: number | null, outOfRange: boolean): string {
  if (cents === null) return 'var(--fg)';
  if (outOfRange) return 'var(--far)';
  const abs = Math.abs(cents);
  return `hsl(${meterHue(abs).toFixed(0)} ${abs <= HUE_STOPS[0][0] ? 70 : 90}% 62%)`;
}

const tickHeight = (c: number) => (c === 0 ? 100 : c % 25 === 0 ? 55 : c % 10 === 0 ? 38 : 22);

export function Meter({ cents }: { cents: number | null }) {
  const clamped = cents === null ? 0 : Math.max(-RANGE, Math.min(RANGE, cents));
  return (
    <div
      class="meter"
      role="meter"
      aria-valuemin={-RANGE}
      aria-valuemax={RANGE}
      aria-valuenow={clamped}
    >
      <div class="zone" />
      <div class="band" />
      <div class="ticks">
        {TICKS.map((c) => (
          <i
            key={c}
            class={c === 0 ? 'zero' : c % 25 === 0 ? 'major' : undefined}
            style={{ left: `${c + RANGE}%`, height: `${tickHeight(c)}%` }}
          />
        ))}
      </div>
      <div class="track">
        <div
          class={cents === null ? 'needle idle' : 'needle'}
          style={{ transform: `translateX(${clamped + RANGE}%)` }}
        />
      </div>
      <div class="labels">
        {LABELS.map((c) => (
          <span key={c} style={{ left: `${c + RANGE}%` }}>
            {c > 0 ? `+${c}` : c < 0 ? `−${-c}` : '0'}
          </span>
        ))}
      </div>
    </div>
  );
}
