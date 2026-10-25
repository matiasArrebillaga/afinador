import { displayNote, type NoteNaming } from '../../music/notes';
import type { TunerView } from '../../music/tuner';
import type { Tuning } from '../../music/tunings';
import { InstrumentIcon } from '../components/InstrumentIcon';
import { Meter, meterColor } from '../components/ArcMeter';
import { StringList } from '../components/StringList';
import { S, tuningLabel } from '../strings';

export interface TunerScreenProps {
  view: TunerView | null;
  tuning: Tuning;
  chromatic: boolean;
  naming: NoteNaming;
  confirmed: ReadonlySet<number>;
  suspended: boolean;
  onResume(): void;
  onOpenPicker(): void;
  onTitleTap(): void;
}

function statusText(view: TunerView): string {
  if (view.outOfRange) return S.status.far;
  if (view.inTune) return S.status.inTune;
  return view.cents < 0 ? S.status.up : S.status.down;
}

export function TunerScreen(p: TunerScreenProps) {
  const { view } = p;
  const state = !view ? '' : view.outOfRange ? ' far' : view.inTune ? ' in-tune' : '';
  const shown = view ? displayNote(view.note, p.naming) : '—';
  const [, name, octave] = /^(.*?)(-?\d*)$/.exec(shown)!;
  const c = view ? Math.round(view.cents) : 0;
  const sign = c > 0 ? '+' : c < 0 ? '−' : '±';
  return (
    <main
      class={`screen tuner${state}`}
      style={{ '--c': meterColor(view?.cents ?? null, !!view?.outOfRange) }}
    >
      <header>
        <h1 onClick={p.onTitleTap}>AFINADOR</h1>
        <button class="chip pick" onClick={p.onOpenPicker}>
          {p.chromatic ? (
            <>
              <InstrumentIcon kind="chromatic" height={28} /> {S.kinds.chromatic}
            </>
          ) : (
            <>
              <InstrumentIcon kind={p.tuning.instrument} height={18} /> {tuningLabel(p.tuning)}{' '}
              <small>
                · {S.kinds[p.tuning.instrument]} {p.tuning.notes.length}
              </small>
            </>
          )}{' '}
          ▾
        </button>
      </header>
      {p.suspended && (
        <button class="resume" onClick={p.onResume} aria-label="resume">
          ▶
        </button>
      )}
      <div class="readout">
        {p.chromatic && <span class="badge">{S.kinds.chromatic}</span>}
        <div class="note">
          {/* key remounts the span so the entry animation plays on every note change */}
          <span key={shown} class="note-inner">
            {name}
            <sub>{octave}</sub>
          </span>
        </div>
        <div class="status" aria-live="polite">
          {view && statusText(view)}
        </div>
      </div>
      <Meter cents={view?.cents ?? null} />
      <div class="hz">
        {view ? (
          <>
            <b>{view.freq.toFixed(1)}</b> Hz ·{' '}
            {view.outOfRange ? (c < 0 ? '<−50' : '>+50') : `${sign}${Math.abs(c)}`}
          </>
        ) : (
          ' '
        )}
      </div>
      {p.chromatic ? (
        <div class="strings-spacer" />
      ) : (
        <StringList
          notes={p.tuning.notes}
          naming={p.naming}
          activeIndex={view?.stringIndex ?? -1}
          confirmed={p.confirmed}
        />
      )}
    </main>
  );
}
