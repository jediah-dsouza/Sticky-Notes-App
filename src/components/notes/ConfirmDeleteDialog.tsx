import { useEffect, useId, useRef, useState } from 'react';
import type { MutationResult, Note } from '../../features/notes/noteTypes';
import { hasContent } from '../../features/notes/noteValidation';
import shared from './Notes.module.css';
import styles from './NoteEditor.module.css';

interface Props {
  note: Note;
  opener: HTMLButtonElement;
  loadError: string | null;
  onRetry: () => void;
  onConfirm: (original: Note) => MutationResult;
  onDeleted: () => void;
  onClose: () => void;
}

export function ConfirmDeleteDialog({
  note,
  opener,
  loadError,
  onRetry,
  onConfirm,
  onDeleted,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const completed = useRef(false);
  const [error, setError] = useState('');
  const id = useId();
  // A display-only excerpt: never alter the note or its stored content.
  const identifier = (hasContent(note.title) ? note.title : note.content)
    .replace(/\s+/g, ' ')
    .trim();
  const preview =
    identifier.length > 80 ? `${identifier.slice(0, 80)}…` : identifier;

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      if (!completed.current && opener.isConnected) opener.focus();
      else
        (
          document.getElementById('empty-notes-heading') ??
          document.getElementById('notes-heading') ??
          document.getElementById('main-content')
        )?.focus();
    };
  }, [opener]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-note ${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          ),
        ).filter((control) => control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className={styles.form}>
        <div className={`${shared.composerHeader} ${styles.header}`}>
          <h2 id={`${id}-heading`}>Delete this note?</h2>
        </div>
        <div className={`${shared.fields} ${styles.fields}`}>
          <p id={`${id}-note`} className={shared.deletePreview}>
            {preview}
          </p>
          <p id={`${id}-description`}>
            This will permanently remove this note from this browser. This
            cannot be undone.
          </p>
          {error && !loadError && (
            <p role="alert" className={shared.errorText}>
              {error}
            </p>
          )}
          {loadError && (
            <div className={shared.recovery}>
              <div role="alert">
                <h3>Saved notes need attention.</h3>
                <p>{loadError}</p>
              </div>
              <p id={`${id}-paused`}>
                Deletion is paused to protect existing data. Retry only reads
                again; it never clears or repairs data. Cancel to review the
                latest notes.
              </p>
              <button
                type="button"
                className={shared.secondaryButton}
                onClick={() => {
                  setError('');
                  onRetry();
                }}
              >
                Retry loading
              </button>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={shared.secondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${shared.primaryButton} ${shared.destructiveButton}`}
            disabled={loadError !== null}
            aria-describedby={loadError ? `${id}-paused` : undefined}
            onClick={() => {
              setError('');
              const result = onConfirm(note);
              if (result.ok) {
                completed.current = true;
                onDeleted();
              } else if (!result.blocked) setError(result.message);
            }}
          >
            Delete note
          </button>
        </div>
      </div>
    </dialog>
  );
}
