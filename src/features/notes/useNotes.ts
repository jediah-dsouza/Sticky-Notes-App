import { useState } from 'react';
import { noteStorage } from '../../services/noteStorage';
import { createNote, sameNote, updateNote } from './noteOperations';
import { hasContent } from './noteValidation';
import type {
  CreateResult,
  EditResult,
  MutationResult,
  Note,
  NoteDraft,
} from './noteTypes';

type NotesState = {
  notes: Note[];
  raw: string | null;
  loadError: string | null;
};

function loadInitial(): NotesState {
  const result = noteStorage.load();
  return result.ok
    ? { notes: result.notes, raw: result.raw, loadError: null }
    : { notes: [], raw: null, loadError: result.message };
}

export function useNotes() {
  const [state, setState] = useState(loadInitial);

  function retryLoading() {
    const result = noteStorage.load();
    if (result.ok)
      setState({ notes: result.notes, raw: result.raw, loadError: null });
    else setState((current) => ({ ...current, loadError: result.message }));
  }

  function saveDraft(draft: NoteDraft): CreateResult {
    if (state.loadError)
      return { ok: false, blocked: true, message: state.loadError };
    if (!hasContent(draft.content))
      return {
        ok: false,
        blocked: false,
        message: 'Write something in the content field before saving.',
      };
    let note: Note;
    try {
      if (typeof globalThis.crypto?.randomUUID !== 'function')
        throw new Error('UUID unavailable');
      const id = globalThis.crypto.randomUUID();
      if (state.notes.some((saved) => saved.id === id))
        throw new Error('Duplicate identifier');
      note = createNote(draft, id, new Date().toISOString());
    } catch {
      return {
        ok: false,
        blocked: false,
        message:
          "A unique note identifier couldn't be created. Your draft is still here. Try again in a supported browser.",
      };
    }
    const notes = [note, ...state.notes];
    const result = noteStorage.save(notes, state.raw);
    if (!result.ok) {
      const blocked = result.kind !== 'write';
      if (blocked)
        setState((current) => ({ ...current, loadError: result.message }));
      return { ok: false, blocked, message: result.message };
    }
    // Never perform storage writes inside a state updater or a mount effect.
    setState({ notes, raw: result.raw, loadError: null });
    return { ok: true };
  }

  function saveEdit(original: Note, draft: NoteDraft): EditResult {
    if (state.loadError)
      return { ok: false, blocked: true, message: state.loadError };
    const current = state.notes.find((note) => note.id === original.id);
    if (!current || !sameNote(current, original))
      return {
        ok: false,
        blocked: false,
        message:
          'This note changed or is no longer available. Your edits are still here. Cancel and reopen the note to review the latest saved version.',
      };
    if (!hasContent(draft.content))
      return {
        ok: false,
        blocked: false,
        message: 'Write something in the content field before saving.',
      };
    if (draft.title === current.title && draft.content === current.content)
      return { ok: true, changed: false };
    let updated: Note;
    try {
      // Avoid identical/regressing update times on fast edits or clock rollback.
      const time = Math.max(Date.now(), Date.parse(current.updatedAt) + 1);
      updated = updateNote(current, draft, new Date(time).toISOString());
    } catch {
      return {
        ok: false,
        blocked: false,
        message:
          "The update time couldn't be created. Your edits are still here; check the device clock and try again.",
      };
    }
    const notes = state.notes.map((note) =>
      note.id === current.id ? updated : note,
    );
    const result = noteStorage.save(notes, state.raw);
    if (!result.ok) {
      const blocked = result.kind !== 'write';
      if (blocked)
        setState((previous) => ({ ...previous, loadError: result.message }));
      return { ok: false, blocked, message: result.message };
    }
    setState({ notes, raw: result.raw, loadError: null });
    return { ok: true, changed: true };
  }

  function deleteNote(original: Note): MutationResult {
    if (state.loadError)
      return { ok: false, blocked: true, message: state.loadError };
    const current = state.notes.find((note) => note.id === original.id);
    if (!current || !sameNote(current, original))
      return {
        ok: false,
        blocked: false,
        message:
          'This note changed or is no longer available. Cancel and review the latest saved notes before deleting.',
      };
    const notes = state.notes.filter((note) => note.id !== original.id);
    const result = noteStorage.save(notes, state.raw);
    if (!result.ok) {
      const blocked = result.kind !== 'write';
      const message =
        result.kind === 'write'
          ? "This note couldn't be deleted. Storage may be full or blocked. The saved note is unchanged; try Delete note again."
          : result.kind === 'changed'
            ? 'Saved data changed since it was loaded, possibly in another tab. Retry loading and review it before deleting.'
            : result.message;
      if (blocked)
        setState((previous) => ({ ...previous, loadError: message }));
      return { ok: false, blocked, message };
    }
    setState({ notes, raw: result.raw, loadError: null });
    return { ok: true };
  }

  return {
    deleteNote,
    saveEdit,
    notes: state.notes,
    loadError: state.loadError,
    retryLoading,
    saveDraft,
  };
}
