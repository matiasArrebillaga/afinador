import { useEffect, useState } from 'preact/hooks';
import { A4_DEFAULT, A4_MAX, A4_MIN, displayNote, type NoteNaming } from '../../music/notes';
import {
  STRING_COUNTS,
  findTuning,
  tuningsFor,
  type Instrument,
  type Tuning,
} from '../../music/tunings';
import { InstrumentIcon, type IconKind } from '../components/InstrumentIcon';
import { Segmented } from '../components/Segmented';
import { S, tuningLabel } from '../strings';

interface Props {
  open: boolean;
  tunings: readonly Tuning[];
  activeId: string;
  chromatic: boolean;
  naming: NoteNaming;
  a4: number;
  onA4(a4: number): void;
  onSelect(id: string): void;
  onChromatic(): void;
  onClose(): void;
  onNew(instrument: Instrument, strings: number): void;
  onEdit(t: Tuning): void;
}

const KINDS: readonly IconKind[] = ['guitar', 'bass', 'chromatic'];

// Bottom sheet over the tuner; stays mounted so it can slide in and out.
export function TuningPicker(p: Props) {
  const active = findTuning(p.tunings, p.activeId);
  const [kind, setKind] = useState<IconKind>(p.chromatic ? 'chromatic' : active.instrument);
  const [strings, setStrings] = useState(active.notes.length);

  useEffect(() => {
    if (!p.open) return;
    setKind(p.chromatic ? 'chromatic' : active.instrument);
    setStrings(active.notes.length);
  }, [p.open]);

  function pickKind(k: IconKind) {
    setKind(k);
    if (k === 'chromatic') p.onChromatic();
    if (k !== 'chromatic')
      setStrings(k === active.instrument ? active.notes.length : STRING_COUNTS[k][0]);
  }

  return (
    <div class={p.open ? 'sheet-wrap open' : 'sheet-wrap'} inert={!p.open}>
      <div class="scrim" onClick={p.onClose} />
      <section class="sheet" role="dialog" aria-label={S.picker.title}>
        <div class="grab" />
        <h2>{S.picker.title}</h2>
        <Segmented
          label={S.picker.title}
          value={kind}
          onChange={pickKind}
          options={KINDS.map((k) => ({
            value: k,
            label: (
              <>
                <InstrumentIcon kind={k} />
                <span>{S.kinds[k]}</span>
              </>
            ),
          }))}
        />
        {kind === 'chromatic' ? (
          <div class="tuning-list" key="chromatic">
            <div class="chroma">
              <b>C C# D … B</b>
              {S.picker.chromaticHint}
            </div>
          </div>
        ) : (
          <>
            <div>
              <div class="label">{S.picker.strings}</div>
              <Segmented
                label={S.picker.strings}
                value={strings}
                onChange={(n) => setStrings(n)}
                options={STRING_COUNTS[kind].map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
            <ul class="tuning-list" key={`${kind}-${strings}`}>
              {tuningsFor(p.tunings, kind, strings).map((t, i) => (
                <li key={t.id} style={{ '--i': i }}>
                  <button
                    class="tuning"
                    aria-pressed={!p.chromatic && t.id === p.activeId}
                    onClick={() => p.onSelect(t.id)}
                  >
                    <span class="name">{tuningLabel(t)}</span>
                    <span class="notes">
                      {t.notes.map((n) => displayNote(n, p.naming)).join(' ')}
                    </span>
                    <span class="mark" />
                  </button>
                  {!t.builtIn && (
                    <button class="edit" aria-label={S.picker.edit} onClick={() => p.onEdit(t)}>
                      ✎
                    </button>
                  )}
                </li>
              ))}
              <li style={{ '--i': tuningsFor(p.tunings, kind, strings).length }}>
                <button class="tuning new" onClick={() => p.onNew(kind, strings)}>
                  <span class="name">{S.picker.newTuning}</span>
                </button>
              </li>
            </ul>
          </>
        )}
        <div class="a4">
          <span class="label">{S.picker.a4}</span>
          <button aria-label="−1 Hz" disabled={p.a4 <= A4_MIN} onClick={() => p.onA4(p.a4 - 1)}>
            −
          </button>
          <button class="a4-value" aria-label={S.picker.a4Reset} onClick={() => p.onA4(A4_DEFAULT)}>
            {p.a4} Hz
          </button>
          <button aria-label="+1 Hz" disabled={p.a4 >= A4_MAX} onClick={() => p.onA4(p.a4 + 1)}>
            +
          </button>
        </div>
      </section>
    </div>
  );
}
