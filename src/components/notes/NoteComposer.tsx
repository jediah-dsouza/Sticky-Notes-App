import { useEffect, useId, useRef, useState } from 'react';
import { hasContent } from '../../features/notes/noteValidation';
import type { CreateResult, NoteDraft } from '../../features/notes/noteTypes';
import styles from './Notes.module.css';
import { useSpeechRecognition } from '../../features/voice/useSpeechRecognition';

interface Props {
  blocked: boolean;
  onSave: (draft: NoteDraft) => CreateResult;
}

export function NoteComposer({ blocked, onSave }: Props) {
  const [draft, setDraft] = useState<NoteDraft>({ title: '', content: '' });
  const [contentError, setContentError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [status, setStatus] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const voice = useSpeechRecognition((text) => {
    setDraft((current) => ({
      ...current,
      content:
        current.content +
        (current.content && !current.content.endsWith('\n') ? '\n' : '') +
        text,
    }));
    setContentError('');
    setSaveError('');
    setStatus('');
  });
  const dirty = hasContent(draft.title) || hasContent(draft.content);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(field: keyof NoteDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveError('');
    setStatus('');
    if (field === 'content') setContentError('');
  }

  return (
    <form
      className={styles.composer}
      aria-labelledby={`${id}-heading`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (voice.isActive()) return;
        setStatus('');
        setSaveError('');
        if (!hasContent(draft.content)) {
          setContentError(
            'Write something in the content field before saving. A title on its own is not enough.',
          );
          contentRef.current?.focus();
          return;
        }
        setContentError('');
        const result = onSave(draft);
        if (result.ok) {
          voice.reset();
          setDraft({ title: '', content: '' });
          setStatus('Note saved in this browser.');
        } else if (!result.blocked) setSaveError(result.message);
      }}
    >
      <div className={styles.composerHeader}>
        <h2 id={`${id}-heading`}>Make a little note.</h2>
        <p>Start with a thought. Give it a title if you like.</p>
      </div>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-title`}>
            Title <span>(optional)</span>
          </label>
          <input
            id={`${id}-title`}
            name="title"
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Give this note a title"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-content`}>
            Content <span>(required)</span>
          </label>
          <textarea
            ref={contentRef}
            id={`${id}-content`}
            name="content"
            value={draft.content}
            required
            rows={4}
            onChange={(event) => update('content', event.target.value)}
            aria-invalid={contentError ? true : undefined}
            aria-describedby={`${id}-voice-help${contentError ? ` ${id}-content-error` : ''}`}
            placeholder="Write something worth remembering…"
          />
          <div className={styles.voice}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={
                voice.state === 'unavailable' || voice.state === 'processing'
              }
              onClick={voice.active ? voice.stop : voice.start}
              aria-describedby={`${id}-voice-status ${id}-voice-help`}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="5" y="1" width="6" height="11" rx="3" />
                <path d="M2 8v2a6 6 0 0 0 12 0V8M8 16v3M5 19h6" />
              </svg>
              {voice.state === 'unavailable'
                ? 'Dictation unavailable'
                : voice.state === 'processing'
                  ? 'Finishing dictation…'
                  : voice.active
                    ? 'Stop dictation'
                    : 'Start dictation'}
            </button>
            <p
              id={`${id}-voice-status`}
              aria-live="polite"
              aria-atomic="true"
              className={
                voice.state === 'error' ? styles.errorText : styles.voiceStatus
              }
            >
              {voice.message}
            </p>
            {voice.interim && (
              <p className={styles.interim}>
                Provisional (not saved): {voice.interim}
              </p>
            )}
            <p id={`${id}-voice-help`} className={styles.voiceHelp}>
              Final text appends at the end of your draft, on a new line. Stop
              dictation before saving. Your browser may send audio to its speech
              service. This app does not record audio.
            </p>
          </div>
          {contentError && (
            <p
              id={`${id}-content-error`}
              className={styles.errorText}
              role="alert"
            >
              {contentError}
            </p>
          )}
        </div>
        {saveError && (
          <p className={styles.errorText} role="alert">
            {saveError}
          </p>
        )}
      </div>
      <div className={styles.composerFooter}>
        <div>
          <p className={styles.status} role="status" aria-atomic="true">
            {status}
          </p>
          {blocked && (
            <p id="saving-paused" className={styles.errorText}>
              Saving is paused to protect existing data. You can still write or
              copy your draft.
            </p>
          )}
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={blocked || voice.active}
          aria-describedby={blocked ? 'saving-paused' : undefined}
        >
          Save note
        </button>
      </div>
    </form>
  );
}
