import { useEffect, useState } from 'preact/hooks';
import { displayNote, type NoteNaming } from '../../music/notes';
import { STRING_COUNTS, findTuning, tuningsFor, type Tuning } from '../../music/tunings';
import { InstrumentIcon, type IconKind } from '../components/InstrumentIcon';
import { Segmented } from '../components/Segmented';
import { S, tuningLabel } from '../strings';

interface Props {
  open: boolean;
  tunings: readonly Tuning[];
  activeId: string;
  chromatic: boolean;
  naming: NoteNaming;
  onSelect(id: string): void;
  onChromatic(): void;
  onClose(): void;
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
            <button class="tuning" aria-pressed={p.chromatic} onClick={p.onChromatic}>
              <span class="name">{S.picker.useChromatic}</span>
              <span class="mark">✓</span>
            </button>
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
              {tuningsFor(p.tunings, kind, strings).map((t) => (
                <li key={t.id}>
                  <button
                    class="tuning"
                    aria-pressed={!p.chromatic && t.id === p.activeId}
                    onClick={() => p.onSelect(t.id)}
                  >
                    <span>
                      <span class="name">{tuningLabel(t)}</span>
                      <span class="notes">
                        {t.notes.map((n, i) => (
                          <span key={i}>{displayNote(n, p.naming)}</span>
                        ))}
                      </span>
                    </span>
                    <span class="mark">✓</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
