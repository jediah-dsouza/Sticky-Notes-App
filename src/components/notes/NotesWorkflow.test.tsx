import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { NOTES_STORAGE_KEY } from '../../services/noteStorage';

const saved = {
  id: 'existing-id',
  title: 'Already saved',
  content: 'Keep this safe',
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};
const titleField = () => screen.getByRole('textbox', { name: /Title/ });
const contentField = () => screen.getByRole('textbox', { name: /Content/ });
const saveButton = () => screen.getByRole('button', { name: 'Save note' });

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('create / persist / display / remount', () => {
  it('shows a genuine empty state without writes on mount, including StrictMode', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(screen.getByText('A fresh sheet.')).toBeVisible();
    expect(screen.getByText('0 notes')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(write).not.toHaveBeenCalled();
  });
  it.each(['', 'A title'])(
    'saves exactly one valid note with title %j, then clears the composer',
    async (title) => {
      const user = userEvent.setup();
      const write = vi.spyOn(Storage.prototype, 'setItem');
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
      if (title) await user.type(titleField(), title);
      await user.type(contentField(), 'A thought worth keeping');
      await user.click(saveButton());
      expect(screen.getAllByRole('article')).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent(
        'Note saved in this browser.',
      );
      expect(titleField()).toHaveValue('');
      expect(contentField()).toHaveValue('');
      expect(write).toHaveBeenCalledTimes(1);
      expect(
        JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!),
      ).toMatchObject([{ title, content: 'A thought worth keeping' }]);
    },
  );
  it.each(['', ' \n\t '])(
    'rejects title-only or whitespace-only content %j without losing draft',
    async (content) => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(titleField(), 'Title alone');
      fireEvent.change(contentField(), { target: { value: content } });
      await user.click(saveButton());
      expect(contentField()).toHaveAttribute('aria-invalid', 'true');
      expect(contentField()).toHaveAccessibleDescription(/Write something/);
      expect(contentField()).toHaveFocus();
      expect(titleField()).toHaveValue('Title alone');
      expect(contentField()).toHaveValue(content);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'A title on its own is not enough.',
      );
      expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
      expect(screen.getByRole('status')).not.toHaveTextContent('Note saved');
    },
  );
  it('preserves all whitespace, note identity and multiline content after remount', async () => {
    const user = userEvent.setup();
    const content = '  First line\n\nSecond line  \n';
    const view = render(<App />);
    await user.type(titleField(), '  Paper  ');
    fireEvent.change(contentField(), { target: { value: content } });
    await user.click(saveButton());
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    const notes = JSON.parse(raw!);
    expect(notes[0].createdAt).toBe(notes[0].updatedAt);
    expect(notes[0].id).toBeTruthy();
    view.unmount();
    render(<App />);
    const article = screen.getByRole('article', { name: 'Paper' });
    expect(article.querySelector('p')?.textContent).toBe(content);
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)).toEqual(notes);
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
  });
  it.each([
    '{broken',
    JSON.stringify([{ ...saved, content: ' ' }]),
    JSON.stringify([saved, saved]),
  ])('blocks mutation and preserves unsafe storage %s', async (raw) => {
    localStorage.setItem(NOTES_STORAGE_KEY, raw);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Saved notes need attention.' }),
    ).toBeVisible();
    expect(screen.queryByText('A fresh sheet.')).not.toBeInTheDocument();
    expect(screen.queryByText('0 notes')).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    await user.type(contentField(), 'Draft can still be written');
    await user.click(screen.getByRole('button', { name: 'Retry loading' }));
    expect(contentField()).toHaveValue('Draft can still be written');
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
    expect(write).not.toHaveBeenCalled();
  });
  it('does not show a false empty state after read exceptions; retry can safely load valid data without clearing a draft', async () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([saved]));
    const read = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't be read");
    expect(screen.queryByText('A fresh sheet.')).not.toBeInTheDocument();
    await user.type(contentField(), 'Keep my draft');
    read.mockRestore();
    await user.click(screen.getByRole('button', { name: 'Retry loading' }));
    expect(
      screen.getByRole('article', { name: 'Already saved' }),
    ).toBeVisible();
    expect(contentField()).toHaveValue('Keep my draft');
    expect(saveButton()).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('does not commit collection state or success before setItem succeeds; preserves the whole draft and allows retry', async () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([saved]));
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    let visibleCountAtWrite = -1;
    let statusAtWrite = '';
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        visibleCountAtWrite = screen.getAllByRole('article').length;
        statusAtWrite = screen.getByRole('status').textContent ?? '';
        throw new DOMException('full', 'QuotaExceededError');
      });
    const user = userEvent.setup();
    render(<App />);
    await user.type(titleField(), 'Unsaved title');
    fireEvent.change(contentField(), {
      target: { value: '  Unsaved\ntext  ' },
    });
    await user.click(saveButton());
    expect(visibleCountAtWrite).toBe(1);
    expect(statusAtWrite).not.toContain('Note saved');
    expect(titleField()).toHaveValue('Unsaved title');
    expect(contentField()).toHaveValue('  Unsaved\ntext  ');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.queryByRole('article', { name: 'Unsaved title' }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't be saved");
    expect(screen.getByRole('status')).not.toHaveTextContent('Note saved');
    write.mockRestore();
    await user.click(saveButton());
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(contentField()).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Note saved');
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)).toHaveLength(
      2,
    );
  });
  it('fails safely when UUID generation is unavailable or collides with an existing ID', async () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([saved]));
    const uuid = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockImplementation(() => {
        throw new Error('unavailable');
      });
    const user = userEvent.setup();
    render(<App />);
    await user.type(contentField(), 'Keep draft');
    await user.click(saveButton());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'unique note identifier',
    );
    expect(contentField()).toHaveValue('Keep draft');
    uuid.mockReturnValue('existing-id' as ReturnType<Crypto['randomUUID']>);
    await user.click(saveButton());
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)).toHaveLength(
      1,
    );
    expect(contentField()).toHaveValue('Keep draft');
  });
  it('keeps the draft and storage untouched if crypto.randomUUID is absent', async () => {
    vi.stubGlobal('crypto', {});
    const user = userEvent.setup();
    render(<App />);
    await user.type(contentField(), 'A draft without UUID support');
    await user.click(saveButton());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'unique note identifier',
    );
    expect(contentField()).toHaveValue('A draft without UUID support');
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  });
  it('preserves newly corrupted data on save, instead of overwriting it with the loaded collection', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(contentField(), 'A safe draft');
    localStorage.setItem(NOTES_STORAGE_KEY, '{newly broken');
    await user.click(saveButton());
    expect(saveButton()).toBeDisabled();
    expect(contentField()).toHaveValue('A safe draft');
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe('{newly broken');
    expect(screen.getByRole('status')).not.toHaveTextContent('Note saved');
  });
  it('blocks stale writes, reloads the changed collection deliberately, and keeps draft text', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(contentField(), 'My unsaved thought');
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([saved]));
    await user.click(saveButton());
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'changed since it was loaded',
    );
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)).toEqual([
      saved,
    ]);
    await user.click(screen.getByRole('button', { name: 'Retry loading' }));
    expect(contentField()).toHaveValue('My unsaved thought');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(saveButton());
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
  it('renders markup as ordinary text', async () => {
    const user = userEvent.setup();
    render(<App />);
    const markup = '<img src=x onerror="alert(1)"><script>bad()</script>';
    fireEvent.change(contentField(), { target: { value: markup } });
    await user.click(saveButton());
    const article = screen.getByRole('article');
    expect(within(article).getByText(markup)).toBeVisible();
    expect(article.querySelector('img,script')).toBeNull();
  });
  it('supports a keyboard-only create journey', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(titleField()).toHaveFocus();
    await user.type(titleField(), 'Keyboard');
    await user.tab();
    expect(contentField()).toHaveFocus();
    await user.keyboard('First line{Enter}Second line');
    await user.tab();
    expect(saveButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('article', { name: 'Keyboard' })).toBeVisible();
  });
  it('warns on navigation with meaningful unsaved input, but stops warning after successful save', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(contentField(), 'Unsaved');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
    await user.click(saveButton());
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
  });
});
