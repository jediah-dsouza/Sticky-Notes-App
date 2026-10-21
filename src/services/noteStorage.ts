import type { Note } from '../features/notes/noteTypes';
import { isNoteCollection } from '../features/notes/noteValidation';

export const NOTES_STORAGE_KEY = 'sticky-notes:notes:v1';
type LocalStore = Pick<Storage, 'getItem' | 'setItem'>;
type StorageError = {
  ok: false;
  kind: 'read' | 'malformed' | 'invalid' | 'changed' | 'write';
  message: string;
};
type ReadResult =
  { ok: true; notes: Note[]; raw: string | null } | StorageError;
type WriteResult = { ok: true; raw: string } | StorageError;

function readFrom(storage: LocalStore): ReadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(NOTES_STORAGE_KEY);
  } catch {
    return {
      ok: false,
      kind: 'read',
      message:
        "Saved notes couldn't be read. Your browser may be blocking storage.",
    };
  }
  if (raw === null) return { ok: true, notes: [], raw };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      kind: 'malformed',
      message:
        'Saved notes contain unreadable data. The original data has not been changed.',
    };
  }
  if (!isNoteCollection(parsed)) {
    return {
      ok: false,
      kind: 'invalid',
      message:
        'Saved notes contain invalid records or duplicate identifiers. Nothing has been discarded or rewritten.',
    };
  }
  return { ok: true, notes: parsed, raw };
}

// The injected getter is only a localStorage test seam, not a multi-backend layer.
export function createNoteStorage(
  getStorage: () => LocalStore = () => window.localStorage,
) {
  return {
    load(): ReadResult {
      try {
        return readFrom(getStorage());
      } catch {
        return {
          ok: false,
          kind: 'read',
          message:
            "Saved notes couldn't be accessed. Your browser may be blocking storage.",
        };
      }
    },
    save(notes: Note[], expectedRaw: string | null): WriteResult {
      let storage: LocalStore;
      try {
        storage = getStorage();
      } catch {
        return {
          ok: false,
          kind: 'read',
          message:
            "Saved notes couldn't be accessed. Saving is paused to protect existing data.",
        };
      }
      const current = readFrom(storage);
      if (!current.ok) return current;
      // Protect against knowingly overwriting changed/corrupted data since load.
      // localStorage cannot make this check-and-write atomic between tabs.
      if (current.raw !== expectedRaw) {
        return {
          ok: false,
          kind: 'changed',
          message:
            'Saved data changed since it was loaded, possibly in another tab. Retry loading before saving your draft.',
        };
      }
      if (!isNoteCollection(notes))
        return {
          ok: false,
          kind: 'invalid',
          message:
            'The note collection could not be validated. Existing data has not been changed.',
        };
      try {
        const raw = JSON.stringify(notes);
        storage.setItem(NOTES_STORAGE_KEY, raw);
        return { ok: true, raw };
      } catch {
        return {
          ok: false,
          kind: 'write',
          message:
            "This note couldn't be saved. Storage may be full or blocked. Your draft is still here; try Save note again.",
        };
      }
    },
  };
}

export const noteStorage = createNoteStorage();
