import { useState } from 'react';
import { ConfirmDeleteDialog } from '../../components/notes/ConfirmDeleteDialog';
import { NoteEditor } from '../../components/notes/NoteEditor';
import type { Note } from './noteTypes';
import { NoteComposer } from '../../components/notes/NoteComposer';
import { NotesCollection } from '../../components/notes/NotesCollection';
import { useNotes } from './useNotes';
import styles from '../../components/layout/Layout.module.css';

export function NotesWorkspace() {
  const notes = useNotes();
  // A transient edit baseline, not a second authoritative saved collection.
  const [editing, setEditing] = useState<{
    note: Note;
    opener: HTMLButtonElement;
  } | null>(null);
  const [deleting, setDeleting] = useState<{
    note: Note;
    opener: HTMLButtonElement;
  } | null>(null);
  const [collectionStatus, setCollectionStatus] = useState('');
  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>Your personal paper space</p>
        <h1>A little space for your thoughts.</h1>
        <p className={styles.lead}>Write it down. Come back to it.</p>
      </div>
      <NoteComposer
        blocked={notes.loadError !== null}
        onSave={notes.saveDraft}
      />
      <p
        className={styles.collectionStatus}
        aria-live="polite"
        aria-atomic="true"
      >
        {collectionStatus}
      </p>
      <NotesCollection
        notes={notes.notes}
        loadError={notes.loadError}
        onRetry={notes.retryLoading}
        onDelete={(note, opener) => {
          setCollectionStatus('');
          setDeleting({ note, opener });
        }}
        onEdit={(note, opener) => {
          setCollectionStatus('');
          setEditing({ note, opener });
        }}
      />
      {editing && (
        <NoteEditor
          key={editing.note.id}
          note={editing.note}
          opener={editing.opener}
          loadError={notes.loadError}
          onRetry={notes.retryLoading}
          onSave={notes.saveEdit}
          onClose={() => setEditing(null)}
          onSaved={(changed) => {
            setEditing(null);
            setCollectionStatus(
              changed ? 'Note updated in this browser.' : 'No changes to save.',
            );
          }}
        />
      )}
      {deleting && (
        <ConfirmDeleteDialog
          note={deleting.note}
          opener={deleting.opener}
          loadError={notes.loadError}
          onRetry={notes.retryLoading}
          onConfirm={notes.deleteNote}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setCollectionStatus('Note deleted from this browser.');
          }}
        />
      )}
      <p className={styles.disclosure}>
        Notes stay in this browser, on this device. Clearing site data removes
        them. There is no cloud backup.
      </p>
    </main>
  );
}
