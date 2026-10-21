import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';
import { App } from '../../app/App';
import { NOTES_STORAGE_KEY as key } from '../../services/noteStorage';

const original = {
  id: 'original',
  title: 'On paper',
  content: 'Keep this safe',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
// jsdom lacks native dialog methods. These model open/close only; real modal
// focus containment, inert background and Escape are verified in Playwright.
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterAll(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});
beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  localStorage.setItem(key, JSON.stringify([original]));
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
const dialog = () => screen.getByRole('dialog');
const title = () => within(dialog()).getByRole('textbox', { name: /Title/ });
const content = () =>
  within(dialog()).getByRole('textbox', { name: /Content/ });
const save = () =>
  within(dialog()).getByRole('button', { name: 'Save changes' });
const cancel = () => within(dialog()).getByRole('button', { name: 'Cancel' });
async function open() {
  const user = userEvent.setup();
  const view = render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  const opener = screen.getByRole('button', { name: 'Edit note: On paper' });
  await user.click(opener);
  return { user, opener, view };
}
function escape() {
  const event = new Event('cancel', { cancelable: true });
  fireEvent(screen.getByRole('dialog'), event);
  expect(event.defaultPrevented).toBe(true);
}

it('prepopulates, saves both fields once, preserves metadata and recovers on remount', async () => {
  const { user, opener, view } = await open();
  expect(title()).toHaveValue(original.title);
  expect(content()).toHaveValue(original.content);
  expect(title()).toHaveFocus();
  const draft = '  First\n\nSecond  \n<img src=x onerror="alert(1)">';
  fireEvent.change(title(), { target: { value: 'Revised' } });
  fireEvent.change(content(), { target: { value: draft } });
  const write = vi.spyOn(Storage.prototype, 'setItem');
  await user.click(save());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(screen.getByText('Note updated in this browser.')).toBeVisible();
  expect(write).toHaveBeenCalledTimes(1);
  const stored = JSON.parse(localStorage.getItem(key)!);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    ...original,
    updatedAt: expect.any(String),
    title: 'Revised',
    content: draft,
  });
  expect(stored[0].updatedAt).not.toBe(original.updatedAt);
  const card = screen.getByRole('article', { name: 'Revised' });
  expect(card.querySelector('img')).toBeNull();
  expect(card.querySelector('p')!.textContent).toBe(draft);
  view.unmount();
  render(<App />);
  expect(screen.getByRole('article', { name: 'Revised' })).toBeVisible();
  expect(screen.getByText(/<img src=x/)).toBeVisible();
});
it.each(['title', 'content'])(
  'supports %s-only edits without duplicates',
  async (field) => {
    const { user } = await open();
    fireEvent.change(field === 'title' ? title() : content(), {
      target: { value: 'Only this changes' },
    });
    await user.click(save());
    const saved = JSON.parse(localStorage.getItem(key)!);
    expect(saved).toHaveLength(1);
    expect(saved[0][field]).toBe('Only this changes');
    expect(saved[0][field === 'title' ? 'content' : 'title']).toBe(
      original[field === 'title' ? 'content' : 'title'],
    );
  },
);
it('validation retains edited title, whitespace draft and saved collection, with associated error and focus', async () => {
  const { user } = await open();
  const raw = localStorage.getItem(key);
  fireEvent.change(title(), { target: { value: 'Draft title' } });
  fireEvent.change(content(), { target: { value: ' \n\t ' } });
  await user.click(save());
  expect(content()).toHaveValue(' \n\t ');
  expect(title()).toHaveValue('Draft title');
  expect(content()).toHaveFocus();
  expect(content()).toHaveAttribute('aria-invalid', 'true');
  expect(content()).toHaveAccessibleDescription(/Write something/);
  expect(localStorage.getItem(key)).toBe(raw);
  expect(
    screen.queryByText('Note updated in this browser.'),
  ).not.toBeInTheDocument();
});
it('write failure keeps editor and draft, does not announce success and can be retried', async () => {
  const { user } = await open();
  const raw = localStorage.getItem(key);
  fireEvent.change(content(), { target: { value: '  Unsaved\n draft  ' } });
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('Quota', 'QuotaExceededError');
    });
  await user.click(save());
  expect(content()).toHaveValue('  Unsaved\n draft  ');
  expect(within(dialog()).getByRole('alert')).toHaveTextContent(
    /couldn't be saved/,
  );
  expect(localStorage.getItem(key)).toBe(raw);
  expect(screen.getByRole('article')).toHaveTextContent(original.content);
  expect(
    screen.queryByText('Note updated in this browser.'),
  ).not.toBeInTheDocument();
  write.mockRestore();
  await user.click(save());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Note updated in this browser.')).toBeVisible();
});
it('Cancel unchanged closes without warning and restores opener focus', async () => {
  const { user, opener } = await open();
  await user.click(cancel());
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});
it('Escape unchanged closes without warning and restores opener focus', async () => {
  const { opener } = await open();
  escape();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});
it.each(['Cancel', 'Escape'])(
  '%s changed warns, Keep editing preserves draft, Discard keeps saved note unchanged',
  async (method) => {
    const { user, opener } = await open();
    const raw = localStorage.getItem(key);
    fireEvent.change(title(), { target: { value: 'Unsaved title' } });
    if (method === 'Cancel') await user.click(cancel());
    else escape();
    const warning = screen.getByRole('alertdialog', {
      name: 'Discard your edits?',
    });
    expect(warning).toHaveAccessibleDescription(/have not been saved/);
    expect(
      within(warning).getByRole('button', { name: 'Keep editing' }),
    ).toHaveFocus();
    await user.click(
      within(warning).getByRole('button', { name: 'Keep editing' }),
    );
    expect(title()).toHaveValue('Unsaved title');
    expect(cancel()).toHaveFocus();
    await user.click(cancel());
    await user.click(screen.getByRole('button', { name: 'Discard edits' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(localStorage.getItem(key)).toBe(raw);
    expect(screen.getByRole('article', { name: 'On paper' })).toBeVisible();
  },
);
it('Escape in discard warning returns to editing rather than discarding', async () => {
  const { user } = await open();
  fireEvent.change(content(), { target: { value: 'Keep this draft' } });
  await user.click(cancel());
  const warning = screen.getByRole('alertdialog');
  const event = new Event('cancel', { cancelable: true });
  fireEvent(warning, event);
  expect(event.defaultPrevented).toBe(true);
  expect(content()).toHaveValue('Keep this draft');
  expect(cancel()).toHaveFocus();
});
it('reverting exact text removes the dirty warning and unchanged Save does not write', async () => {
  const { user } = await open();
  fireEvent.change(title(), { target: { value: 'Changed' } });
  fireEvent.change(title(), { target: { value: original.title } });
  const write = vi.spyOn(Storage.prototype, 'setItem');
  await user.click(save());
  expect(write).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('No changes to save.')).toBeVisible();
});
it('recovery blocks editor save, preserves draft, retries without destroying raw data, and rejects stale baseline', async () => {
  const { user } = await open();
  fireEvent.change(content(), { target: { value: 'My retained draft' } });
  localStorage.setItem(key, '{broken original');
  const write = vi.spyOn(Storage.prototype, 'setItem');
  await user.click(save());
  expect(save()).toBeDisabled();
  expect(content()).toHaveValue('My retained draft');
  expect(within(dialog()).getByRole('alert')).toHaveTextContent(/unreadable/);
  await user.click(
    within(dialog()).getByRole('button', { name: 'Retry loading' }),
  );
  expect(localStorage.getItem(key)).toBe('{broken original');
  expect(write).not.toHaveBeenCalled();
  write.mockRestore();
  const external = [{ ...original, content: 'Changed in another tab' }];
  localStorage.setItem(key, JSON.stringify(external));
  const protect = vi.spyOn(Storage.prototype, 'setItem');
  await user.click(
    within(dialog()).getByRole('button', { name: 'Retry loading' }),
  );
  await user.click(save());
  expect(content()).toHaveValue('My retained draft');
  expect(within(dialog()).getByRole('alert')).toHaveTextContent(
    /changed or is no longer/,
  );
  expect(protect).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual(external);
});

it('a whitespace-only optional title preserves its bytes without an empty heading', async () => {
  const { user } = await open();
  fireEvent.change(title(), { target: { value: '   ' } });
  await user.click(save());
  const card = screen.getByRole('article', { name: 'Untitled note' });
  expect(within(card).queryByRole('heading')).not.toBeInTheDocument();
  expect(
    within(card).getByRole('button', { name: 'Edit note: Untitled note' }),
  ).toBeVisible();
  expect(JSON.parse(localStorage.getItem(key)!)[0].title).toBe('   ');
});
