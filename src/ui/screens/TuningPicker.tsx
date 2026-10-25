import { useState } from 'preact/hooks';
import { displayNote, type NoteNaming } from '../../music/notes';
import {
  STRING_COUNTS,
  findTuning,
  tuningsFor,
  type Instrument,
  type Tuning,
} from '../../music/tunings';
import { InstrumentIcon } from '../components/InstrumentIcon';
import { tuningLabel } from '../strings';

interface Props {
  tunings: readonly Tuning[];
  activeId: string;
  naming: NoteNaming;
  onSelect(id: string): void;
  onClose(): void;
}

export function TuningPicker({ tunings, activeId, naming, onSelect, onClose }: Props) {
  const active = findTuning(tunings, activeId);
  const [instrument, setInstrument] = useState<Instrument>(active.instrument);
  const [strings, setStrings] = useState(active.notes.length);
  const list = tuningsFor(tunings, instrument, strings);

  return (
    <main class="screen picker">
      <header>
        <div class="row">
          {(['guitar', 'bass'] as const).map((i) => (
            <button
              key={i}
              aria-label={i}
              aria-pressed={i === instrument}
              onClick={() => {
                setInstrument(i);
                setStrings(STRING_COUNTS[i][0]);
              }}
            >
              <InstrumentIcon instrument={i} />
            </button>
          ))}
        </div>
        <button onClick={onClose} aria-label="close">
          ✕
        </button>
      </header>
      <div class="row">
        {STRING_COUNTS[instrument].map((n) => (
          <button key={n} aria-pressed={n === strings} onClick={() => setStrings(n)}>
            {n}
          </button>
        ))}
      </div>
      <ul class="tuning-list">
        {list.map((t) => (
          <li key={t.id}>
            <button aria-pressed={t.id === activeId} onClick={() => onSelect(t.id)}>
              <span>{tuningLabel(t)}</span>
              <span class="dim">{t.notes.map((n) => displayNote(n, naming)).join(' ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
