import { displayNote, type NoteNaming } from '../../music/notes';

interface Props {
  notes: readonly string[];
  naming: NoteNaming;
  activeIndex: number;
  confirmed: ReadonlySet<number>;
  onTap?(index: number): void;
}

export function StringList({ notes, naming, activeIndex, confirmed, onTap }: Props) {
  return (
    <div class="strings" style={{ '--count': notes.length }}>
      <ol>
        {notes.map((note, i) => (
          <li key={i}>
            <button
              aria-pressed={i === activeIndex}
              class={confirmed.has(i) ? 'done' : undefined}
              onClick={onTap && (() => onTap(i))}
            >
              {displayNote(note, naming)}
              {confirmed.has(i) && <span class="sr-only"> ✓</span>}
            </button>
          </li>
        ))}
      </ol>
      {/* One shared underline that slides to the active string. */}
      <span
        class="string-line"
        aria-hidden="true"
        style={{
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          opacity: activeIndex < 0 ? 0 : 1,
        }}
      />
    </div>
  );
}
