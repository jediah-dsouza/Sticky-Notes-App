import { useEffect, useId, useRef, useState } from 'react';
import type {
  EditResult,
  Note,
  NoteDraft,
} from '../../features/notes/noteTypes';
import { hasContent } from '../../features/notes/noteValidation';
import shared from './Notes.module.css';
import styles from './NoteEditor.module.css';

interface Props {
  note: Note;
  opener: HTMLButtonElement;
  loadError: string | null;
  onRetry: () => void;
  onSave: (original: Note, draft: NoteDraft) => EditResult;
  onSaved: (changed: boolean) => void;
  onClose: () => void;
}

export function NoteEditor({
  note,
  opener,
  loadError,
  onRetry,
  onSave,
  onSaved,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<NoteDraft>({
    title: note.title,
    content: note.content,
  });
  const [contentError, setContentError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const returningFromWarning = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const dirty = draft.title !== note.title || draft.content !== note.content;

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      dialog.close();
      if (opener.isConnected) opener.focus();
      else document.getElementById('main-content')?.focus();
    };
  }, [opener]);

  useEffect(() => {
    if (confirmDiscard) keepRef.current?.focus();
    else if (returningFromWarning.current) {
      returningFromWarning.current = false;
      cancelRef.current?.focus();
    }
  }, [confirmDiscard]);

  function keepEditing() {
    returningFromWarning.current = true;
    setConfirmDiscard(false);
  }

  function requestDismiss() {
    if (confirmDiscard) keepEditing();
    else if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function update(field: keyof NoteDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveError('');
    if (field === 'content') setContentError('');
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role={confirmDiscard ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby={`${id}-${confirmDiscard ? 'discard' : 'heading'}`}
      aria-describedby={
        confirmDiscard ? `${id}-discard-description` : undefined
      }
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        // Native modality makes the background inert; explicitly wrap the form
        // edges so keyboard focus does not step into browser chrome.
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'input:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
          ),
        ).filter((element) => element.getClientRects().length > 0);
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
      onCancel={(event) => {
        event.preventDefault();
        requestDismiss();
      }}
    >
      <div hidden={confirmDiscard}>
        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSaveError('');
            if (!hasContent(draft.content)) {
              setContentError(
                'Write something in the content field before saving. A title on its own is not enough.',
              );
              contentRef.current?.focus();
              return;
            }
            setContentError('');
            const result = onSave(note, draft);
            if (result.ok) onSaved(result.changed);
            else if (!result.blocked)
              setSaveError(
                result.message.replace(
                  'try Save note again',
                  'try Save changes again',
                ),
              );
          }}
        >
          <div className={`${shared.composerHeader} ${styles.header}`}>
            <h2 id={`${id}-heading`}>Edit your note.</h2>
            <p>A little revision. The original stays safe until you save.</p>
          </div>
          <div className={`${shared.fields} ${styles.fields}`}>
            <div className={shared.field}>
              <label htmlFor={`${id}-title`}>
                Title <span>(optional)</span>
              </label>
              <input
                ref={titleRef}
                id={`${id}-title`}
                name="title"
                value={draft.title}
                onChange={(event) => update('title', event.target.value)}
              />
            </div>
            <div className={shared.field}>
              <label htmlFor={`${id}-content`}>
                Content <span>(required)</span>
              </label>
              <textarea
                ref={contentRef}
                id={`${id}-content`}
                name="content"
                rows={5}
                required
                value={draft.content}
                onChange={(event) => update('content', event.target.value)}
                aria-invalid={contentError ? true : undefined}
                aria-describedby={
                  contentError ? `${id}-content-error` : undefined
                }
              />
              {contentError && (
                <p
                  id={`${id}-content-error`}
                  className={shared.errorText}
                  role="alert"
                >
                  {contentError}
                </p>
              )}
            </div>
            {saveError && (
              <p className={shared.errorText} role="alert">
                {saveError}
              </p>
            )}
            {loadError && (
              <div className={shared.recovery}>
                <div role="alert">
                  <h3>Saved notes need attention.</h3>
                  <p>{loadError}</p>
                </div>
                <p id={`${id}-paused`}>
                  Saving is paused to protect existing data. Retry only reads
                  again; it never clears or repairs data. Your edits are still
                  here.
                </p>
                <button
                  type="button"
                  className={shared.secondaryButton}
                  onClick={onRetry}
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
              onClick={requestDismiss}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={shared.primaryButton}
              disabled={loadError !== null}
              aria-describedby={loadError ? `${id}-paused` : undefined}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
      <div hidden={!confirmDiscard} className={styles.warning}>
        <h2 id={`${id}-discard`}>Discard your edits?</h2>
        <p id={`${id}-discard-description`}>
          Your changes have not been saved. Keep editing to hold onto them, or
          discard them and leave the saved note unchanged.
        </p>
        <div className={styles.warningActions}>
          <button
            ref={keepRef}
            type="button"
            className={shared.primaryButton}
            onClick={keepEditing}
          >
            Keep editing
          </button>
          <button
            type="button"
            className={shared.secondaryButton}
            onClick={onClose}
          >
            Discard edits
          </button>
        </div>
      </div>
    </dialog>
  );
}
