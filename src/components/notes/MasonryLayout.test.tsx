import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NotesCollection } from './NotesCollection';
import type { Note } from '../../features/notes/noteTypes';

const notes: Note[] = [
  {
    id: 'b',
    title: '',
    content: '  First\n\nSecond  \n',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'a',
    title: 'A long thought',
    content: '<img src=x> https://example.test/' + 'longword'.repeat(30),
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];
const props = {
  loadError: null,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};
let resized: ResizeObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
let queued: FrameRequestCallback;
let height = 101;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resized = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    queued = callback;
    return 7;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) =>
      name === '--masonry-row' ? '4px' : '24px',
  } as CSSStyleDeclaration);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ height }) as DOMRect,
  );
  observe.mockClear();
  disconnect.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  height = 101;
});
function resize() {
  act(() => resized([], {} as ResizeObserver));
}
function frame() {
  act(() => queued(0));
}

it('renders one sorted semantic list with literal multiline/title-less text and named actions', () => {
  render(<NotesCollection {...props} notes={notes} />);
  expect(
    screen
      .getAllByRole('article')
      .map((card) => card.getAttribute('aria-label')),
  ).toEqual(['A long thought', 'Untitled note']);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(
    screen.getByRole('article', { name: 'Untitled note' }).querySelector('p')
      ?.textContent,
  ).toBe(notes[0].content);
  expect(
    screen.getByRole('article', { name: 'A long thought' }).querySelector('p')
      ?.textContent,
  ).toBe(notes[1].content);
  expect(document.querySelector('img')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Edit note: Untitled note' }),
  ).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Delete note: A long thought' }),
  ).toBeEnabled();
});
it('allocates rounded natural-height spans, observes articles rather than allocated items', () => {
  render(<NotesCollection {...props} notes={notes} />);
  expect(screen.getByRole('list')).toHaveAttribute('data-masonry', 'ready');
  screen
    .getAllByRole('listitem')
    .forEach((item) => expect(item.style.gridRowEnd).toBe('span 32'));
  expect(observe.mock.calls.map(([element]) => element.tagName)).toEqual([
    'UL',
    'ARTICLE',
    'ARTICLE',
  ]);
});
it('batches repeated resize notifications and measures the changed height', () => {
  render(<NotesCollection {...props} notes={notes} />);
  height = 201;
  resize();
  resize();
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame();
  expect(screen.getAllByRole('listitem')[0].style.gridRowEnd).toBe('span 57');
  resize();
  expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
});
it('remeasures changed collections and disconnects the old observer', () => {
  const { rerender } = render(<NotesCollection {...props} notes={notes} />);
  height = 401;
  rerender(
    <NotesCollection
      {...props}
      notes={[{ ...notes[1], content: 'Longer\n'.repeat(30) }]}
    />,
  );
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('listitem').style.gridRowEnd).toBe('span 107');
});
it('cleans up queued work and span enhancements on unmount, including Strict Mode', () => {
  const { unmount } = render(
    <StrictMode>
      <NotesCollection {...props} notes={notes} />
    </StrictMode>,
  );
  const list = screen.getByRole('list');
  const item = screen.getAllByRole('listitem')[0];
  resize();
  unmount();
  expect(disconnect).toHaveBeenCalledTimes(2);
  expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
  expect(list).not.toHaveAttribute('data-masonry');
  expect(item.style.gridRowEnd).toBe('');
});
it('retains a readable unenhanced list when ResizeObserver is unavailable', () => {
  vi.stubGlobal('ResizeObserver', undefined);
  render(<NotesCollection {...props} notes={notes} />);
  expect(screen.getByRole('list')).not.toHaveAttribute('data-masonry');
  expect(screen.getAllByRole('article')).toHaveLength(2);
});
it('does not enable tiny rows before positive natural heights are measurable', () => {
  height = 0;
  render(<NotesCollection {...props} notes={notes} />);
  expect(screen.getByRole('list')).not.toHaveAttribute('data-masonry');
  height = 101;
  resize();
  frame();
  expect(screen.getByRole('list')).toHaveAttribute('data-masonry', 'ready');
});
it('removes the list for the empty state and keeps non-destructive recovery available', () => {
  const { rerender } = render(<NotesCollection {...props} notes={notes} />);
  rerender(<NotesCollection {...props} notes={[]} />);
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'A fresh sheet.' }),
  ).toHaveAttribute('tabindex', '-1');
  rerender(
    <NotesCollection {...props} notes={[]} loadError="Unreadable data" />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Unreadable data');
  expect(screen.getByRole('button', { name: 'Retry loading' })).toBeEnabled();
});
