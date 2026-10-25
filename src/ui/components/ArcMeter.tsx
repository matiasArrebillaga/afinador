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

// inTune follows the tuner's hysteresis, so the dot stays lime as long as the arc does.
export function meterColor(cents: number | null, outOfRange: boolean, inTune = false): string {
  if (cents === null) return 'var(--fg)';
  if (outOfRange) return 'var(--far)';
  const abs = Math.abs(cents);
  if (inTune || abs <= HUE_STOPS[0][0]) return 'var(--ok)';
  return `hsl(${meterHue(abs).toFixed(0)} 90% 62%)`;
}

/** Dot angle in degrees from vertical: −90 (left end) … +90 (right end). */
export function arcAngle(cents: number | null): number {
  if (cents === null) return 0;
  return (Math.max(-RANGE, Math.min(RANGE, cents)) / RANGE) * 90;
}

/**
 * Dash pattern on the arc (pathLength 180, 1 unit = 1°) for one side of the trace, from the
 * center toward the dot. One path per side keeps each anchored at the center, so crossing zero
 * shrinks one side and grows the other instead of sliding a single segment across.
 */
export function traceDash(angle: number, side: 1 | -1): string {
  const len = Math.max(0, side * angle);
  return `0 ${side === 1 ? 90 : 90 - len} ${len} 360`;
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
    <div class={cents === null ? 'arc idle' : 'arc'}>
      {/* The meter is the svg alone, and only with a reading: children (note, ▶) stay readable. */}
      <svg
        viewBox="0 0 200 110"
        {...(cents === null
          ? { 'aria-hidden': true }
          : {
              role: 'meter',
              'aria-valuemin': -RANGE,
              'aria-valuemax': RANGE,
              'aria-valuenow': Math.round((angle / 90) * RANGE),
            })}
      >
        <path class="base" d={ARC} pathLength={180} />
        <path class="lock" d={ARC} pathLength={180} />
        <line class="zero" x1={100} y1={4} x2={100} y2={16} />
        {([-1, 1] as const).map((side) => (
          <path
            key={side}
            class="trace"
            d={ARC}
            pathLength={180}
            style={{ strokeDasharray: traceDash(angle, side) }}
          />
        ))}
        {/* Rotating the group around the arc center moves the dot along the curve. */}
        <g class="dot" style={{ transform: `rotate(${angle}deg)` }}>
          <circle cx={100} cy={10} r={5} />
        </g>
      </svg>
      <div class="arc-center">{children}</div>
    </div>
  );
}
