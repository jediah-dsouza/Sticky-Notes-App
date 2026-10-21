import type { Note, NoteDraft } from './noteTypes';
import { hasContent, isIsoTimestamp } from './noteValidation';

// Browser capability access belongs to the coordinator, not this pure operation.
export function createNote(
  draft: NoteDraft,
  id: string,
  timestamp: string,
): Note {
  if (!hasContent(draft.content) || !id.trim() || !isIsoTimestamp(timestamp)) {
    throw new Error('Invalid note creation input.');
  }
  return {
    id,
    title: draft.title,
    content: draft.content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const byTime = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    return byTime || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}

// Exact comparisons preserve intentional whitespace edits; no-op saves stay no-ops.
export function sameNote(a: Note, b: Note): boolean {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.content === b.content &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt
  );
}

export function updateNote(
  note: Note,
  draft: NoteDraft,
  timestamp: string,
): Note {
  if (
    !hasContent(draft.content) ||
    !isIsoTimestamp(timestamp) ||
    Date.parse(timestamp) <= Date.parse(note.updatedAt)
  ) {
    throw new Error('Invalid note update input.');
  }
  return {
    ...note,
    title: draft.title,
    content: draft.content,
    updatedAt: timestamp,
  };
}
