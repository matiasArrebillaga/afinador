import type { Instrument } from '../../music/tunings';

// ponytail: geometric glyphs; replace with real drawings once the icon set is decided.
export function InstrumentIcon({ instrument }: { instrument: Instrument }) {
  return (
    <svg viewBox="0 0 24 48" width="24" height="48" fill="currentColor" aria-hidden="true">
      {instrument === 'guitar' ? (
        <>
          <rect x="10" y="2" width="4" height="26" />
          <circle cx="12" cy="36" r="9" />
        </>
      ) : (
        <>
          <rect x="10" y="0" width="4" height="34" />
          <rect x="5" y="32" width="14" height="14" />
        </>
      )}
    </svg>
  );
}
