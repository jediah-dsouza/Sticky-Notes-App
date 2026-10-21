import { describe, expect, it, vi } from 'vitest';
import { createNoteStorage, NOTES_STORAGE_KEY } from './noteStorage';
import { createNote } from '../features/notes/noteOperations';

const note = createNote(
  { title: 'Title', content: 'Line one\nLine two' },
  'id-a',
  '2026-10-20T12:00:00.000Z',
);
function fixture(initial: string | null = null) {
  let raw = initial;
  const storage = {
    getItem: vi.fn(() => raw),
    setItem: vi.fn((_key: string, value: string) => {
      raw = value;
    }),
  };
  return { storage, adapter: createNoteStorage(() => storage), raw: () => raw };
}

describe('localStorage adapter', () => {
  it('treats a missing key as empty and does not write on load', () => {
    const { adapter, storage } = fixture();
    expect(adapter.load()).toEqual({ ok: true, notes: [], raw: null });
    expect(storage.getItem).toHaveBeenCalledWith(NOTES_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('restores valid notes without rewriting their raw representation', () => {
    const raw = JSON.stringify([note], null, 2);
    const f = fixture(raw);
    expect(f.adapter.load()).toEqual({ ok: true, notes: [note], raw });
    expect(f.raw()).toBe(raw);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('saves one JSON array under the approved key and recovers it', () => {
    const f = fixture();
    const result = f.adapter.save([note], null);
    expect(result.ok).toBe(true);
    expect(f.storage.setItem).toHaveBeenCalledExactlyOnceWith(
      NOTES_STORAGE_KEY,
      JSON.stringify([note]),
    );
    expect(f.adapter.load()).toMatchObject({ ok: true, notes: [note] });
  });
  it.each([
    ['{broken', 'malformed'],
    ['', 'malformed'],
    ['null', 'invalid'],
    ['{}', 'invalid'],
    [JSON.stringify([{ ...note, content: ' ' }]), 'invalid'],
    [JSON.stringify([note, note]), 'invalid'],
    [JSON.stringify([{ ...note, updatedAt: 'wrong' }]), 'invalid'],
  ])('rejects unsafe raw data %s without rewriting it', (raw, kind) => {
    const f = fixture(raw);
    expect(f.adapter.load()).toMatchObject({ ok: false, kind });
    expect(f.adapter.save([note], raw)).toMatchObject({ ok: false, kind });
    expect(f.raw()).toBe(raw);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('reports storage getter exceptions without pretending to be empty', () => {
    const adapter = createNoteStorage(() => {
      throw new Error('Blocked');
    });
    expect(adapter.load()).toMatchObject({ ok: false, kind: 'read' });
    expect(adapter.save([note], null)).toMatchObject({
      ok: false,
      kind: 'read',
    });
  });
  it('reports getItem exceptions and blocks writes', () => {
    const f = fixture();
    f.storage.getItem.mockImplementation(() => {
      throw new Error('Read blocked');
    });
    expect(f.adapter.load()).toMatchObject({ ok: false, kind: 'read' });
    expect(f.adapter.save([note], null)).toMatchObject({
      ok: false,
      kind: 'read',
    });
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it.each(['QuotaExceededError', 'SecurityError'])(
    'preserves prior data when setItem throws %s',
    (name) => {
      const raw = JSON.stringify([note]);
      const f = fixture(raw);
      f.storage.setItem.mockImplementation(() => {
        throw new DOMException('blocked', name);
      });
      expect(
        f.adapter.save([{ ...note, id: 'id-b' }, note], raw),
      ).toMatchObject({ ok: false, kind: 'write' });
      expect(f.raw()).toBe(raw);
    },
  );
  it('refuses to knowingly overwrite data changed since load, including newly malformed data', () => {
    const f = fixture(JSON.stringify([note]));
    expect(f.adapter.save([note], null)).toMatchObject({
      ok: false,
      kind: 'changed',
    });
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('rejects an invalid outgoing collection', () => {
    const f = fixture();
    expect(f.adapter.save([note, note], null)).toMatchObject({
      ok: false,
      kind: 'invalid',
    });
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
});
