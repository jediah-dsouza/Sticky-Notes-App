import { hasContent } from '../../features/notes/noteValidation';
import type { Note } from '../../features/notes/noteTypes';
import styles from './Notes.module.css';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onDelete: (note: Note, opener: HTMLButtonElement) => void;
  onEdit: (note: Note, opener: HTMLButtonElement) => void;
}) {
  const hasTitle = hasContent(note.title);
  return (
    <article
      className={styles.card}
      aria-label={hasTitle ? note.title : 'Untitled note'}
    >
      {hasTitle && <h3>{note.title}</h3>}
      <p className={styles.noteContent}>{note.content}</p>
      <p className={styles.timestamp}>
        Saved{' '}
        <time dateTime={note.updatedAt}>
          {dateFormat.format(new Date(note.updatedAt))}
        </time>
      </p>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          aria-label={`Edit note: ${hasTitle ? note.title : 'Untitled note'}`}
          onClick={(event) => onEdit(note, event.currentTarget)}
        >
          Edit note
        </button>
        <button
          type="button"
          className={`${styles.secondaryButton} ${styles.deleteAction}`}
          aria-label={`Delete note: ${hasTitle ? note.title : 'Untitled note'}`}
          onClick={(event) => onDelete(note, event.currentTarget)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
