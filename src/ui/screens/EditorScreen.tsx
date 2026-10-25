import { useState } from 'preact/hooks';
import { shiftNote } from '../../music/editor';
import { displayNote, type NoteNaming } from '../../music/notes';
import { MAX_NAME, isValidName, type Tuning } from '../../music/tunings';
import { S } from '../strings';

interface Props {
  initial: Tuning;
  naming: NoteNaming;
  onSave(t: Tuning): void;
  onDelete?(): void;
  onCancel(): void;
}

export function EditorScreen({ initial, naming, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [armed, setArmed] = useState(false);
  const shift = (i: number, by: number) =>
    setNotes((ns) => ns.map((n, j) => (j === i ? shiftNote(n, by) : n)));

  return (
    <main class="screen editor">
      <header>
        <button onClick={onCancel} aria-label={S.editor.cancel}>
          ✕
        </button>
        <h1>
          {S.kinds[initial.instrument]} {notes.length}
        </h1>
        <button
          disabled={!isValidName(name)}
          onClick={() => onSave({ ...initial, name: name.trim(), notes })}
          aria-label={S.editor.save}
        >
          ✓
        </button>
      </header>
      <input
        value={name}
        maxLength={MAX_NAME}
        placeholder={S.editor.name}
        aria-label={S.editor.name}
        onInput={(e) => setName(e.currentTarget.value)}
      />
      <ol class="editor-strings">
        {notes.map((note, i) => (
          <li key={i}>
            <button onClick={() => shift(i, -1)} aria-label={`${S.editor.down} ${i + 1}`}>
              ▼
            </button>
            <span aria-live="polite">{displayNote(note, naming)}</span>
            <button onClick={() => shift(i, 1)} aria-label={`${S.editor.up} ${i + 1}`}>
              ▲
            </button>
          </li>
        ))}
      </ol>
      {onDelete && (
        <button
          class={armed ? 'delete armed' : 'delete'}
          onClick={() => (armed ? onDelete() : setArmed(true))}
        >
          {armed ? S.editor.confirmDelete : S.editor.delete}
        </button>
      )}
    </main>
  );
}
