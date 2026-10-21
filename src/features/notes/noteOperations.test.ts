import { describe, expect, it } from 'vitest';
import { createNote, sortNotes } from './noteOperations';
import { hasContent, isIsoTimestamp, isNoteCollection } from './noteValidation';

const timestamp = '2026-10-20T12:00:00.000Z';
const note = createNote(
  { title: '', content: 'A thought' },
  'note-a',
  timestamp,
);

describe('note domain', () => {
  it('preserves title, whitespace and line breaks and initializes matching timestamps', () => {
    const draft = {
      title: '  A title  ',
      content: '  First line\n\nSecond line  \n',
    };
    expect(createNote(draft, 'unique-id', timestamp)).toEqual({
      id: 'unique-id',
      ...draft,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
  it('accepts a content-only note with exactly five fields', () => {
    expect(Object.keys(note).sort()).toEqual([
      'content',
      'createdAt',
      'id',
      'title',
      'updatedAt',
    ]);
    expect(note.title).toBe('');
  });
  it.each(['', ' ', '\n\t '])(
    'rejects empty/whitespace content %j even with title',
    (content) => {
      expect(hasContent(content)).toBe(false);
      expect(() =>
        createNote({ title: 'Title only', content }, 'id', timestamp),
      ).toThrow();
    },
  );
  it('rejects invalid generation metadata', () => {
    expect(() =>
      createNote({ title: '', content: 'text' }, '', timestamp),
    ).toThrow();
    expect(() =>
      createNote({ title: '', content: 'text' }, 'id', 'bad date'),
    ).toThrow();
  });
  it('sorts by actual instants with lexical IDs as a deterministic tie-breaker without mutating input', () => {
    const newest = { ...note, id: 'latest', updatedAt: '2026-10-21T00:00:00Z' };
    const tiedB = { ...note, id: 'b', updatedAt: '2026-10-20T17:00:00+05:00' };
    const tiedA = { ...note, id: 'a' };
    const input = [tiedB, tiedA, newest];
    expect(sortNotes(input).map((item) => item.id)).toEqual([
      'latest',
      'a',
      'b',
    ]);
    expect(input).toEqual([tiedB, tiedA, newest]);
  });
  it.each([
    '2026-10-20T12:00:00.000Z',
    '2026-10-20T17:00:00+05:00',
    '2024-02-29T00:00:00Z',
  ])('accepts valid ISO timestamp %s', (value) => {
    expect(isIsoTimestamp(value)).toBe(true);
  });
  it.each([
    '2026-02-30T12:00:00Z',
    '2025-02-29T12:00:00Z',
    '2026-10-20',
    'tomorrow',
    '2026-10-20T24:00:00Z',
    '2026-10-20T12:60:00Z',
    123,
    null,
  ])('rejects invalid timestamp %j', (value) => {
    expect(isIsoTimestamp(value)).toBe(false);
  });
  it('accepts a missing title value only as the empty string and a valid empty array', () => {
    expect(isNoteCollection([note])).toBe(true);
    expect(isNoteCollection([])).toBe(true);
  });
  it.each([
    null,
    {},
    [null],
    [{ ...note, id: '' }],
    [{ ...note, title: null }],
    [{ ...note, content: '  ' }],
    [{ ...note, createdAt: 'bad' }],
    [{ ...note, updatedAt: '2020-01-01T00:00:00Z' }],
    [{ ...note, id: 1 }],
    [{ ...note, color: 'red' }],
    [{ id: 'a', content: 'missing fields' }],
    [note, { ...note }],
  ])('rejects invalid collection %#', (value) => {
    expect(isNoteCollection(value)).toBe(false);
  });
});
