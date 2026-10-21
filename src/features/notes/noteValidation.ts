import type { Note } from './noteTypes';

export function hasContent(content: string): boolean {
  return content.trim().length > 0;
}

// Accept timezone-qualified ISO date-times, not Date.parse's permissive date-only
// or normalized impossible dates. New records use toISOString() (UTC milliseconds).
export function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, y, m, d, h, min, sec] = match.map(Number);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= days[m - 1] &&
    h < 24 &&
    min < 60 &&
    sec < 60
  );
}

export function isNoteCollection(value: unknown): value is Note[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((record: unknown) => {
    if (typeof record !== 'object' || record === null) return false;
    const note = record as Record<string, unknown>;
    if (
      Object.keys(note).length !== 5 ||
      typeof note.id !== 'string' ||
      note.id.trim().length === 0 ||
      ids.has(note.id) ||
      typeof note.title !== 'string' ||
      typeof note.content !== 'string' ||
      !hasContent(note.content) ||
      !isIsoTimestamp(note.createdAt) ||
      !isIsoTimestamp(note.updatedAt) ||
      Date.parse(note.updatedAt) < Date.parse(note.createdAt)
    )
      return false;
    ids.add(note.id);
    return true;
  });
}
