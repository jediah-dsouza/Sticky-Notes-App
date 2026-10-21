import type { Note } from '../../features/notes/noteTypes';
import { useMasonryLayout } from './useMasonryLayout';
import { NoteCard } from './NoteCard';
import { sortNotes } from '../../features/notes/noteOperations';
import styles from './Notes.module.css';

interface Props {
  notes: readonly Note[];
  loadError: string | null;
  onRetry: () => void;
  onDelete: (note: Note, opener: HTMLButtonElement) => void;
  onEdit: (note: Note, opener: HTMLButtonElement) => void;
}

export function NotesCollection({
  notes,
  loadError,
  onRetry,
  onEdit,
  onDelete,
}: Props) {
  const masonryRef = useMasonryLayout(notes);
  return (
    <section className={styles.collection} aria-labelledby="notes-heading">
      <div className={styles.collectionHeader}>
        <h2 id="notes-heading" tabIndex={-1}>
          Your notes
        </h2>
        {!loadError && (
          <p>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        )}
      </div>
      {loadError && (
        <div className={styles.recovery}>
          <div role="alert">
            <h3>Saved notes need attention.</h3>
            <p>{loadError}</p>
          </div>
          <p>
            Saving is paused. Retry only reads the data again; it never clears
            or repairs it. Keep your draft here or copy it somewhere safe.
          </p>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onRetry}
          >
            Retry loading
          </button>
          {notes.length > 0 && (
            <p>Showing the last successfully loaded notes below.</p>
          )}
        </div>
      )}
      {notes.length > 0 ? (
        <ul ref={masonryRef} className={styles.grid}>
          {sortNotes(notes).map((note) => (
            <li key={note.id}>
              <NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      ) : (
        !loadError && (
          <div className={styles.empty}>
            <h3 id="empty-notes-heading" tabIndex={-1}>
              A fresh sheet.
            </h3>
            <p>Write your first note above. It will be kept in this browser.</p>
          </div>
        )
      )}
    </section>
  );
}
