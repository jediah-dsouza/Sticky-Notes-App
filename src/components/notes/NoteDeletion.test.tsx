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
  id: 'a',
  title: 'On paper',
  content: 'Keep this safe',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const other = { ...original, id: 'b', title: 'Another thought' };
// jsdom models open/close only. Native focus containment is tested in Chromium.
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
  localStorage.setItem(key, JSON.stringify([original, other]));
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
const dialog = () =>
  screen.getByRole('alertdialog', { name: 'Delete this note?' });
const confirm = () =>
  within(dialog()).getByRole('button', { name: 'Delete note' });
async function open() {
  const user = userEvent.setup();
  const view = render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  const opener = screen.getByRole('button', { name: 'Delete note: On paper' });
  await user.click(opener);
  return { user, view, opener };
}
it('opening and cancelling preserve exact storage, initial Cancel focus and opener restoration', async () => {
  const raw = localStorage.getItem(key);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const { user, opener } = await open();
  expect(dialog()).toHaveAttribute('aria-modal', 'true');
  expect(within(dialog()).getByText('On paper')).toBeInTheDocument();
  const cancel = within(dialog()).getByRole('button', { name: 'Cancel' });
  expect(cancel).toHaveFocus();
  expect(localStorage.getItem(key)).toBe(raw);
  await user.click(cancel);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(localStorage.getItem(key)).toBe(raw);
  expect(write).not.toHaveBeenCalled();
});
it('native cancel event safely dismisses without writes', async () => {
  const { opener } = await open();
  const raw = localStorage.getItem(key);
  const write = vi.spyOn(Storage.prototype, 'setItem');
  fireEvent(dialog(), new Event('cancel', { cancelable: true }));
  expect(opener).toHaveFocus();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem(key)).toBe(raw);
});
it('confirmation removes exactly one, announces success, focuses heading and survives remount', async () => {
  const { user, view } = await open();
  await user.click(confirm());
  expect(
    screen.queryByRole('article', { name: 'On paper' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('article', { name: 'Another thought' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Note deleted from this browser.')).toHaveAttribute(
    'aria-live',
    'polite',
  );
  expect(screen.getByRole('heading', { name: 'Your notes' })).toHaveFocus();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([other]);
  view.unmount();
  render(<App />);
  expect(
    screen.queryByRole('article', { name: 'On paper' }),
  ).not.toBeInTheDocument();
});
it('last note deletion focuses genuine empty state and remains empty on remount', async () => {
  localStorage.setItem(key, JSON.stringify([original]));
  const { user, view } = await open();
  await user.click(confirm());
  expect(screen.getByRole('heading', { name: 'A fresh sheet.' })).toHaveFocus();
  expect(localStorage.getItem(key)).toBe('[]');
  view.unmount();
  render(<App />);
  expect(screen.getByText('0 notes')).toBeInTheDocument();
});
it('failed write keeps dialog and saved data, announces error not success; retry works', async () => {
  const { user } = await open();
  const raw = localStorage.getItem(key);
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('Quota', 'QuotaExceededError');
    });
  await user.click(confirm());
  expect(within(dialog()).getByRole('alert')).toHaveTextContent(
    "couldn't be deleted",
  );
  expect(screen.getByRole('article', { name: 'On paper' })).toBeInTheDocument();
  expect(localStorage.getItem(key)).toBe(raw);
  expect(
    screen.queryByText('Note deleted from this browser.'),
  ).not.toBeInTheDocument();
  write.mockRestore();
  await user.click(confirm());
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([other]);
});
it.each(['broken', '[{}]', JSON.stringify([original, original])])(
  'unsafe storage %s blocks deletion and retry never repairs it',
  async (unsafe) => {
    const { user } = await open();
    localStorage.setItem(key, unsafe);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    await user.click(confirm());
    expect(confirm()).toBeDisabled();
    expect(within(dialog()).getByRole('alert')).toHaveTextContent(
      'Saved notes need attention',
    );
    await user.click(
      within(dialog()).getByRole('button', { name: 'Retry loading' }),
    );
    expect(localStorage.getItem(key)).toBe(unsafe);
    expect(write).not.toHaveBeenCalled();
    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getByRole('article', { name: 'On paper' }),
    ).toBeInTheDocument();
  },
);
it.each(['changed', 'removed'])(
  'stale note %s cannot be deleted after reloading the collection',
  async (kind) => {
    const { user } = await open();
    const latest = JSON.stringify(
      kind === 'changed'
        ? [{ ...original, content: 'Changed externally' }, other]
        : [other],
    );
    localStorage.setItem(key, latest);
    await user.click(confirm());
    await user.click(
      within(dialog()).getByRole('button', { name: 'Retry loading' }),
    );
    await user.click(confirm());
    expect(within(dialog()).getByRole('alert')).toHaveTextContent(
      'changed or is no longer available',
    );
    expect(localStorage.getItem(key)).toBe(latest);
    expect(
      screen.queryByText('Note deleted from this browser.'),
    ).not.toBeInTheDocument();
  },
);
it('a content-only note has a bounded literal-text preview, never HTML', async () => {
  const content = '<img src=x onerror="alert(1)">' + 'a'.repeat(120);
  localStorage.setItem(
    key,
    JSON.stringify([{ ...original, title: '', content }]),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole('button', { name: 'Delete note: Untitled note' }),
  );
  expect(
    within(dialog()).getByText(content.slice(0, 80) + '…'),
  ).toBeInTheDocument();
  expect(dialog().querySelector('img')).toBeNull();
});
it('deleting never erases a draft in the separate create composer', async () => {
  const { user } = await open();
  await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
  await user.type(
    screen.getByRole('textbox', { name: /Content/ }),
    'My unsaved draft',
  );
  await user.click(
    screen.getByRole('button', { name: 'Delete note: On paper' }),
  );
  await user.click(confirm());
  expect(screen.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'My unsaved draft',
  );
});
