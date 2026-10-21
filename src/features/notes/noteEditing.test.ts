import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { sameNote, sortNotes, updateNote } from './noteOperations';
import { useNotes } from './useNotes';
import { NOTES_STORAGE_KEY as key } from '../../services/noteStorage';

const original = {
  id: 'a',
  title: 'Original',
  content: 'Original body',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const newer = {
  ...original,
  id: 'b',
  title: 'Newer',
  updatedAt: '2026-02-01T00:00:00.000Z',
};
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(key, JSON.stringify([original, newer]));
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-03-01T00:00:00.000Z'));
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

it('pure update preserves identity, creation time and exact text, without mutating its input', () => {
  const draft = { title: '  Revised  ', content: '  First\n\nSecond  \n' };
  const result = updateNote(original, draft, '2026-03-01T00:00:00.000Z');
  expect(result).toEqual({
    ...original,
    ...draft,
    updatedAt: '2026-03-01T00:00:00.000Z',
  });
  expect(original.title).toBe('Original');
  expect(sameNote(result, original)).toBe(false);
});
it.each([' \n ', ''])('pure update rejects invalid content %j', (content) => {
  expect(() =>
    updateNote(
      original,
      { title: 'Title', content },
      '2026-03-01T00:00:00.000Z',
    ),
  ).toThrow();
});
it.each(['bad', original.updatedAt, '2025-01-01T00:00:00.000Z'])(
  'rejects invalid or non-newer update time %s',
  (time) => {
    expect(() => updateNote(original, original, time)).toThrow();
  },
);
it.each([
  { title: 'Title only', content: original.content },
  { title: original.title, content: 'Body only' },
  { title: '', content: '  multiline\n\n preserved  \n' },
])(
  'updates only requested fields, persists one identity and reorders %j',
  (draft) => {
    const { result } = renderHook(useNotes);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    let outcome;
    act(() => {
      outcome = result.current.saveEdit(original, draft);
    });
    expect(outcome).toEqual({ ok: true, changed: true });
    expect(write).toHaveBeenCalledTimes(1);
    expect(result.current.notes).toHaveLength(2);
    const updated = sortNotes(result.current.notes)[0];
    expect(updated).toEqual({
      ...original,
      ...draft,
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(
      result.current.notes,
    );
  },
);
it('unchanged save is a no-op without timestamp changes or a write', () => {
  const { result } = renderHook(useNotes);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  let outcome;
  act(() => {
    outcome = result.current.saveEdit(original, original);
  });
  expect(outcome).toEqual({ ok: true, changed: false });
  expect(result.current.notes[0]).toEqual(original);
  expect(write).not.toHaveBeenCalled();
});
it('uses a strictly newer millisecond when the device clock regresses', () => {
  vi.spyOn(Date, 'now').mockReturnValue(0);
  const { result } = renderHook(useNotes);
  act(() => {
    result.current.saveEdit(original, { ...original, title: 'Clock safe' });
  });
  expect(result.current.notes[0].updatedAt).toBe('2026-01-01T00:00:00.001Z');
});
it('validation failure preserves the collection and timestamps without writing', () => {
  const { result } = renderHook(useNotes);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  let outcome;
  act(() => {
    outcome = result.current.saveEdit(original, {
      title: 'Title',
      content: ' \n ',
    });
  });
  expect(outcome).toMatchObject({ ok: false, blocked: false });
  expect(result.current.notes).toEqual([original, newer]);
  expect(write).not.toHaveBeenCalled();
});
it('write happens before state commit; failure retains previous collection and update time', () => {
  const { result } = renderHook(useNotes);
  const raw = localStorage.getItem(key);
  let observed;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    observed = result.current.notes;
    throw new DOMException('Test quota', 'QuotaExceededError');
  });
  let outcome;
  act(() => {
    outcome = result.current.saveEdit(original, {
      ...original,
      title: 'Not saved',
    });
  });
  expect(observed).toEqual([original, newer]);
  expect(outcome).toMatchObject({ ok: false, blocked: false });
  expect(result.current.notes).toEqual([original, newer]);
  expect(localStorage.getItem(key)).toBe(raw);
});
it.each([
  '{broken',
  JSON.stringify([{ ...original, content: ' ' }]),
  JSON.stringify([original, original]),
])('blocks unsafe changed snapshots and preserves raw data %s', (raw) => {
  const { result } = renderHook(useNotes);
  localStorage.setItem(key, raw);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  act(() => {
    result.current.saveEdit(original, { ...original, title: 'Draft' });
  });
  expect(result.current.loadError).not.toBeNull();
  let outcome;
  act(() => {
    outcome = result.current.saveEdit(original, {
      ...original,
      title: 'Still draft',
    });
  });
  expect(outcome).toMatchObject({ ok: false, blocked: true });
  expect(result.current.notes).toEqual([original, newer]);
  expect(localStorage.getItem(key)).toBe(raw);
  expect(write).not.toHaveBeenCalled();
});
it('read exception on edit blocks without a write or timestamp change', () => {
  const { result } = renderHook(useNotes);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Read blocked', 'SecurityError');
  });
  act(() => {
    result.current.saveEdit(original, { ...original, title: 'Draft' });
  });
  expect(result.current.loadError).toMatch(/couldn't be read/);
  expect(result.current.notes).toEqual([original, newer]);
  expect(write).not.toHaveBeenCalled();
});
it.each([
  { external: [] },
  { external: [{ ...original, content: 'Changed elsewhere' }] },
])(
  'refuses stale editor after recovery reload changes or removes the target %j',
  ({ external }) => {
    const { result } = renderHook(useNotes);
    localStorage.setItem(key, JSON.stringify(external));
    act(() => {
      result.current.saveEdit(original, { ...original, title: 'Draft' });
    });
    expect(result.current.loadError).not.toBeNull();
    act(() => {
      result.current.retryLoading();
    });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    let outcome;
    act(() => {
      outcome = result.current.saveEdit(original, {
        ...original,
        title: 'Draft',
      });
    });
    expect(outcome).toMatchObject({
      ok: false,
      blocked: false,
      message: expect.stringMatching(/changed or is no longer/),
    });
    expect(write).not.toHaveBeenCalled();
    expect(result.current.notes).toEqual(external);
  },
);
it('can retry after an unrelated external note changes, while retaining the target baseline', () => {
  const { result } = renderHook(useNotes);
  const external = [original, { ...newer, title: 'Other tab' }];
  localStorage.setItem(key, JSON.stringify(external));
  act(() => {
    result.current.saveEdit(original, { ...original, title: 'Draft' });
  });
  act(() => {
    result.current.retryLoading();
  });
  act(() => {
    result.current.saveEdit(original, { ...original, title: 'Draft' });
  });
  expect(result.current.notes.map((n) => n.title)).toEqual([
    'Draft',
    'Other tab',
  ]);
});
