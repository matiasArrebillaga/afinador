import { useId } from 'preact/hooks';
import type { Instrument } from '../../music/tunings';

export type IconKind = Instrument | 'chromatic';

const peg = (x: number, y: number, r: number) =>
  `M${x + r} ${y}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0z`;

// Silhouettes in a 24×64 box. Parts are separate paths so their windings can't cancel.
const SHAPES = {
  guitar: {
    parts: [
      'M10.2 1.5c1.6-.6 4.6-.4 5.6.6.8.8.4 2-.4 2.6l-1.6 1.2c-.8.6-1 1.4-1 2.3V12h-2.6V2.6c0-.5-.1-.9 0-1.1z',
      'M10.6 11.5h2.8V38h-2.8z',
      'M8.4 33.6c-.9-3.2-2.6-4.9-4.3-4.6-1.6.3-1.6 2.6-.6 5 .9 2.2.6 3.9-.6 5.7-2.2 3.4-2.6 8.6-.2 12.6 2.2 3.7 5.8 5.6 9.3 5.6s7.1-1.9 9.3-5.6c2.4-4 2-9.2-.2-12.6-1.2-1.8-1.3-3.3-.3-5.5 1.1-2.6.7-4.9-.9-5.1-1.9-.2-3.3 1.6-4.2 4.5-.7 2.1-6.6 2.2-7.3 0z',
    ],
    pickups: 'M9 41h6v1.6H9zM9 45h6v1.6H9zM8.6 50h6.8v1.4H8.6z',
    pegs: [4.2, 7.2, 10.2].map((y) => peg(15.2, y, 0.9)).join(''),
  },
  bass: {
    parts: [
      'M10.4 0.6c1.4-.4 3.6-.2 4.6.5.7.5.6 1.5 0 2l-.8.6c-.6.5-.8 1.1-.8 1.9V14h-2.8V1.5c0-.4-.1-.8-.2-.9z',
      'M10.7 13.5h2.6V42h-2.6z',
      'M8.6 39.2c-.6-2.9-2-4.9-3.6-4.8-1.5.1-1.8 2.2-1 4.4.8 2.1.6 3.6-.4 5.3-1.9 3.3-2.1 8 .2 11.4 2.1 3.2 5.2 4.9 8.2 4.9s6.1-1.7 8.2-4.9c2.3-3.4 2.1-8.1.2-11.4-.9-1.6-1-2.8-.3-4.6.8-2.2.4-4.2-1-4.3-1.6-.1-2.7 1.5-3.4 3.9-.6 1.9-6.4 2-7.1.1z',
    ],
    pickups: 'M9.2 46h5.6v1.8H9.2zM9.2 51.5h5.6v1.8H9.2z',
    pegs: [3, 6.3, 9.6, 12.9].map((y) => peg(15.6, y, 1)).join(''),
  },
};

export function InstrumentIcon({ kind, height = 30 }: { kind: IconKind; height?: number }) {
  const id = useId(); // mask ids must be unique per instance
  if (kind === 'chromatic') {
    return (
      <svg
        viewBox="0 0 24 24"
        height={height * 0.6}
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M9 3v18M15 3v18M5 9l14-3M5 18l14-3" />
      </svg>
    );
  }
  const s = SHAPES[kind];
  return (
    <svg viewBox="0 0 24 64" height={height} fill="currentColor" aria-hidden="true">
      <mask id={id}>
        <rect width="24" height="64" fill="#fff" />
        <path d={s.pickups} fill="#000" />
      </mask>
      <g mask={`url(#${id})`}>
        {s.parts.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d={s.pegs} />
    </svg>
  );
}
