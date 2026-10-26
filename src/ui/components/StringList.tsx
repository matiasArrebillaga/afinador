import { displayNote, type NoteNaming } from '../../music/notes';
import { S } from '../strings';

interface Props {
  notes: readonly string[];
  naming: NoteNaming;
  activeIndex: number;
  confirmed: ReadonlySet<number>;
  lockedIndex: number | null;
  onTap(index: number): void;
}

export function StringList({ notes, naming, activeIndex, confirmed, lockedIndex, onTap }: Props) {
  const shown = lockedIndex ?? activeIndex;
  const allDone = confirmed.size === notes.length;
  return (
    <div
      class={`strings${lockedIndex === null ? '' : ' locked'}${allDone ? ' all-done' : ''}`}
      style={{ '--count': notes.length }}
    >
      <ol>
        {notes.map((note, i) => (
          <li key={i}>
            <button
              aria-pressed={i === shown}
              class={confirmed.has(i) ? 'done' : undefined}
              style={{ '--i': i }}
              onClick={(e) => {
                e.stopPropagation(); // the screen behind unlocks on tap
                onTap(i);
              }}
            >
              {displayNote(note, naming)}
              {confirmed.has(i) && <span class="sr-only"> ✓</span>}
              {i === lockedIndex && <span class="sr-only"> {S.locked}</span>}
            </button>
          </li>
        ))}
      </ol>
      {/* One shared underline that slides to the active string. */}
      <span
        class="string-line"
        aria-hidden="true"
        style={{
          transform: `translateX(${Math.max(shown, 0) * 100}%)`,
          opacity: shown < 0 ? 0 : 1,
        }}
      />
    </div>
  );
}
