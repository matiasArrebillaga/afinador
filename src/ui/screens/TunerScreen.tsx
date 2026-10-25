import { displayNote, type NoteNaming } from '../../music/notes';
import type { TunerView } from '../../music/tuner';
import type { Tuning } from '../../music/tunings';
import { ArcMeter, meterColor } from '../components/ArcMeter';
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

// Not shown: only read out by screen readers, and only when it changes.
function statusText(view: TunerView): string {
  if (view.outOfRange) return S.status.far;
  if (view.inTune) return S.status.inTune;
  return view.cents < 0 ? S.status.up : S.status.down;
}

function centsText(view: TunerView): string {
  const c = Math.round(view.cents);
  if (view.outOfRange) return c < 0 ? '<−50' : '>+50';
  return c > 0 ? `+${c}` : c < 0 ? `−${-c}` : '0';
}

export function TunerScreen(p: TunerScreenProps) {
  const { view } = p;
  const state = !view ? ' idle' : view.outOfRange ? ' far' : view.inTune ? ' in-tune' : '';
  const shown = view ? displayNote(view.note, p.naming) : '—';
  const [, name, octave] = /^(.*?)(-?\d*)$/.exec(shown)!;
  return (
    <main
      class={`screen tuner${state}`}
      style={{ '--c': meterColor(view?.cents ?? null, !!view?.outOfRange) }}
    >
      <header>
        <h1 onClick={p.onTitleTap}>AFINADOR</h1>
        <button class="pick" onClick={p.onOpenPicker}>
          <span class="pick-text">{p.chromatic ? S.kinds.chromatic : tuningLabel(p.tuning)}</span>
          {!p.chromatic && (
            <small>
              {S.kinds[p.tuning.instrument]} {p.tuning.notes.length}
            </small>
          )}
          <span aria-hidden="true">▾</span>
        </button>
      </header>
      {p.suspended && (
        <button class="resume" onClick={p.onResume} aria-label="resume">
          ▶
        </button>
      )}
      <div class="dial">
        <ArcMeter cents={view?.cents ?? null}>
          <div class="note">
            {/* key remounts the span so the entry animation plays on every note change */}
            <span key={shown} class="note-inner">
              {name}
              <sub>{octave}</sub>
            </span>
          </div>
        </ArcMeter>
        <div class="readout">
          <div class="cents">{view && centsText(view)}</div>
          <div class="hz">{view && `${view.freq.toFixed(1)} Hz`}</div>
          <div class="sr-only" aria-live="polite">
            {view && statusText(view)}
          </div>
        </div>
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
