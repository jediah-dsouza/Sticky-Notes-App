import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useNotes } from './useNotes';
import { NOTES_STORAGE_KEY as key } from '../../services/noteStorage';
const original = {
  id: 'a',
  title: 'Selected',
  content: '  Keep exact\n text  ',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const other = { ...original, id: 'b', title: 'Remaining' };
const raw = JSON.stringify([original, other]);
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(key, raw);
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it('persists before committing; removes exactly selected and preserves all other fields', () => {
  const { result } = renderHook(useNotes);
  const previous = result.current.notes;
  const set = Storage.prototype.setItem;
  let duringWrite;
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(function (this: Storage, k, value) {
      duringWrite = result.current.notes;
      set.call(this, k, value);
    });
  let outcome;
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toEqual({ ok: true });
  expect(duringWrite).toBe(previous);
  expect(write).toHaveBeenCalledExactlyOnceWith(key, JSON.stringify([other]));
  expect(result.current.notes).toEqual([other]);
  expect(result.current.notes[0]).toBe(previous[1]);
});
it('last deletion stores an empty array and survives remount', () => {
  localStorage.setItem(key, JSON.stringify([original]));
  const view = renderHook(useNotes);
  act(() => {
    view.result.current.deleteNote(original);
  });
  expect(localStorage.getItem(key)).toBe('[]');
  view.unmount();
  expect(renderHook(useNotes).result.current.notes).toEqual([]);
});
it('write failure preserves collection, returns no success and can be retried', () => {
  const { result } = renderHook(useNotes);
  const previous = result.current.notes;
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
  let outcome;
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toMatchObject({ ok: false, blocked: false });
  expect(result.current.notes).toBe(previous);
  expect(result.current.loadError).toBeNull();
  expect(localStorage.getItem(key)).toBe(raw);
  write.mockRestore();
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toEqual({ ok: true });
  expect(result.current.notes).toEqual([other]);
});
it.each(['{bad', '[{}]', JSON.stringify([original, original])])(
  'rejects unsafe data %s without rewriting it',
  (unsafe) => {
    const { result } = renderHook(useNotes);
    localStorage.setItem(key, unsafe);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    let outcome;
    act(() => {
      outcome = result.current.deleteNote(original);
    });
    expect(outcome).toMatchObject({ ok: false, blocked: true });
    expect(result.current.notes).toEqual([original, other]);
    expect(result.current.loadError).not.toBeNull();
    act(() => {
      result.current.deleteNote(original);
    });
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(key)).toBe(unsafe);
  },
);
it('read exception blocks mutation without false empty or writes', () => {
  const { result } = renderHook(useNotes);
  const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  const write = vi.spyOn(Storage.prototype, 'setItem');
  let outcome;
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toMatchObject({ ok: false, blocked: true });
  expect(result.current.notes).toEqual([original, other]);
  expect(write).not.toHaveBeenCalled();
  read.mockRestore();
  expect(localStorage.getItem(key)).toBe(raw);
});
it('changed raw snapshot is protected even when parsed values match', () => {
  const { result } = renderHook(useNotes);
  const changed = JSON.stringify([original, other], null, 2);
  localStorage.setItem(key, changed);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  let outcome;
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toMatchObject({ ok: false, blocked: true });
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem(key)).toBe(changed);
});
it.each(['changed', 'removed'])(
  'stale selected baseline %s stays refused after recovery retry',
  (kind) => {
    const { result } = renderHook(useNotes);
    const latest =
      kind === 'changed'
        ? [{ ...original, content: 'Updated elsewhere' }, other]
        : [other];
    const latestRaw = JSON.stringify(latest);
    localStorage.setItem(key, latestRaw);
    act(() => {
      result.current.deleteNote(original);
    });
    act(() => {
      result.current.retryLoading();
    });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    let outcome;
    act(() => {
      outcome = result.current.deleteNote(original);
    });
    expect(outcome).toMatchObject({ ok: false, blocked: false });
    expect(result.current.notes).toEqual(latest);
    expect(localStorage.getItem(key)).toBe(latestRaw);
    expect(write).not.toHaveBeenCalled();
  },
);
it('recovery may reload unrelated changes, then safely delete unchanged selected baseline', () => {
  const { result } = renderHook(useNotes);
  const updatedOther = { ...other, title: 'Updated other' };
  localStorage.setItem(key, JSON.stringify([original, updatedOther]));
  act(() => {
    result.current.deleteNote(original);
  });
  act(() => {
    result.current.retryLoading();
  });
  act(() => {
    result.current.deleteNote(original);
  });
  expect(result.current.notes).toEqual([updatedOther]);
  expect(localStorage.getItem(key)).toBe(JSON.stringify([updatedOther]));
});
it('initial recovery blocks deletion without resetting the original value', () => {
  localStorage.setItem(key, 'broken');
  const { result } = renderHook(useNotes);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  let outcome;
  act(() => {
    outcome = result.current.deleteNote(original);
  });
  expect(outcome).toMatchObject({ ok: false, blocked: true });
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem(key)).toBe('broken');
});
