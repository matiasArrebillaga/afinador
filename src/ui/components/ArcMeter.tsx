import type { ComponentChildren } from 'preact';

const RANGE = 50;
// ∩ semicircle in SVG units: center (100,100), radius 90. pathLength 180 makes 1 unit = 1°.
const ARC = 'M10 100 A90 90 0 0 1 190 100';
// Hue stops by |cents|: lime when in tune, amber mid-way, red far off.
const HUE_STOPS: readonly [number, number][] = [
  [3, 78],
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
  if (abs <= HUE_STOPS[0][0]) return 'var(--ok)';
  return `hsl(${meterHue(abs).toFixed(0)} 90% 62%)`;
}

/** Dot angle in degrees from vertical: −90 (left end) … +90 (right end). */
export function arcAngle(cents: number | null): number {
  if (cents === null) return 0;
  return (Math.max(-RANGE, Math.min(RANGE, cents)) / RANGE) * 90;
}

/** Dash pattern on the arc (pathLength 180, 1 unit = 1°) drawing from the center to the dot. */
export function traceDash(angle: number): string {
  return `0 ${90 + Math.min(0, angle)} ${Math.abs(angle)} 360`;
}

export function ArcMeter({
  cents,
  children,
}: {
  cents: number | null;
  children?: ComponentChildren;
}) {
  const angle = arcAngle(cents);
  return (
    <div
      class={cents === null ? 'arc idle' : 'arc'}
      role="meter"
      aria-valuemin={-RANGE}
      aria-valuemax={RANGE}
      aria-valuenow={Math.round((angle / 90) * RANGE)}
    >
      <svg viewBox="0 0 200 110" aria-hidden="true">
        <path class="base" d={ARC} pathLength={180} />
        <path class="lock" d={ARC} pathLength={180} />
        <line class="zero" x1={100} y1={4} x2={100} y2={16} />
        <path class="trace" d={ARC} pathLength={180} style={{ strokeDasharray: traceDash(angle) }} />
        {/* Rotating the group around the arc center moves the dot along the curve. */}
        <g class="dot" style={{ transform: `rotate(${angle}deg)` }}>
          <circle cx={100} cy={10} r={5} />
        </g>
      </svg>
      <div class="arc-center">{children}</div>
    </div>
  );
}
