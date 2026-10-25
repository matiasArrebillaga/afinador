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
    <ol class="strings">
      {notes.map((note, i) => (
        <li key={i}>
          <button aria-pressed={i === activeIndex} onClick={onTap && (() => onTap(i))}>
            {displayNote(note, naming)}
            {confirmed.has(i) && <span class="ok">✓</span>}
          </button>
        </li>
      ))}
    </ol>
  );
}
