import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const key = 'sticky-notes:notes:v1';
const existing = {
  id: 'existing',
  title: 'Already on paper',
  content: 'Keep this saved note safe.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const edited =
  '  A revised thought.\n\nMake room for what matters.  \n' +
  'longword'.repeat(15) +
  '\n<img src=x onerror="window.noteExecuted=true">';
async function inspect(page: Page, name: string) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const modal = page.getByRole('dialog').or(page.getByRole('alertdialog'));
  const bounds = await modal.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  expect(
    await modal.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir('artifacts/phase3/accessibility', { recursive: true });
  await writeFile(
    `artifacts/phase3/accessibility/${name}.json`,
    JSON.stringify(
      {
        url: page.url(),
        violations: axe.violations,
        passes: axe.passes.length,
      },
      null,
      2,
    ),
  );
  expect(axe.violations).toEqual([]);
  await mkdir('artifacts/phase3/screenshots', { recursive: true });
  const path = `artifacts/phase3/screenshots/${name}.png`;
  await page.screenshot({ path });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

for (const width of [390, 768, 1440]) {
  test(`keyboard edit, validation, discard and production reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('textbox', { name: /Title/ }).fill('A first thought');
    await page
      .getByRole('textbox', { name: /Content/ })
      .fill('The original note.');
    await page.getByRole('button', { name: 'Save note' }).click();
    const before = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    // Tab from the create button reaches the discoverable card action.
    await page.keyboard.press('Tab');
    const opener = page.getByRole('button', {
      name: 'Edit note: A first thought',
    });
    await expect(opener).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Edit your note.' });
    const title = dialog.getByRole('textbox', { name: /Title/ });
    const body = dialog.getByRole('textbox', { name: /Content/ });
    const save = dialog.getByRole('button', { name: 'Save changes' });
    await expect(title).toHaveValue('A first thought');
    await expect(body).toHaveValue('The original note.');
    await expect(title).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(save).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(title).toBeFocused();
    await page
      .getByRole('main')
      .evaluate((element) => (element as HTMLElement).focus());
    await expect(title).toBeFocused(); // Background is genuinely inert.
    expect(
      await title.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('solid');
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible(); // Backdrop is not a discard path.
    await title.focus();
    await inspect(page, `editor-${width}`);
    await title.fill('A revised thought');
    await body.fill(' \n\t ');
    await save.click();
    await expect(body).toBeFocused();
    await expect(body).toHaveAccessibleDescription(/Write something/);
    await expect(body).toHaveValue(' \n\t ');
    await expect(title).toHaveValue('A revised thought');
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual(before);
    await inspect(page, `edit-validation-${width}`);
    await page.keyboard.press('Escape');
    const warning = page.getByRole('alertdialog', {
      name: 'Discard your edits?',
    });
    await expect(
      warning.getByRole('button', { name: 'Keep editing' }),
    ).toBeFocused();
    await inspect(page, `discard-${width}`);
    await page.keyboard.press('Enter');
    await expect(
      dialog.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeFocused();
    await expect(body).toHaveValue(' \n\t ');
    await body.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(edited);
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Note updated in this browser.')).toBeVisible();
    const updatedOpener = page.getByRole('button', {
      name: 'Edit note: A revised thought',
    });
    await expect(updatedOpener).toBeFocused();
    const after = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    expect(after).toHaveLength(1);
    expect(after[0]).toEqual({
      ...before[0],
      title: 'A revised thought',
      content: edited,
      updatedAt: expect.any(String),
    });
    expect(Date.parse(after[0].updatedAt)).toBeGreaterThan(
      Date.parse(before[0].updatedAt),
    );
    await page.reload();
    const card = page.getByRole('article', { name: 'A revised thought' });
    await expect(card).toBeVisible();
    expect(await card.locator('p').first().textContent()).toBe(edited);
    expect(await card.locator('img,script').count()).toBe(0);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual(after);
    await updatedOpener.click();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(updatedOpener).toBeFocused();
    await updatedOpener.click();
    await dialog
      .getByRole('textbox', { name: /Title/ })
      .fill('Discard this revision');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(
      warning.getByRole('button', { name: 'Keep editing' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      warning.getByRole('button', { name: 'Discard edits' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card).toBeVisible();
    await expect(updatedOpener).toBeFocused();
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual(after);
    expect(
      await page.evaluate(() => Reflect.get(window, 'noteExecuted')),
    ).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test(`edit write failure preserves saved note, modal and draft at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.addInitScript(
      ({ key, existing }) => {
        const original = Storage.prototype.setItem;
        original.call(localStorage, key, JSON.stringify([existing]));
        Storage.prototype.setItem = function (name, value) {
          if (name === key)
            throw new DOMException(
              'Deterministic quota failure',
              'QuotaExceededError',
            );
          original.call(this, name, value);
        };
        Reflect.set(window, 'restoreNoteWrites', () => {
          Storage.prototype.setItem = original;
        });
      },
      { key, existing },
    );
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Edit note: Already on paper' })
      .click();
    const dialog = page.getByRole('dialog');
    const title = dialog.getByRole('textbox', { name: /Title/ });
    const body = dialog.getByRole('textbox', { name: /Content/ });
    await title.fill('A revision waiting to be saved');
    await body.fill('  Please keep my edits.\nThey are still a draft.  ');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog.getByRole('alert')).toContainText("couldn't be saved");
    await expect(title).toHaveValue('A revision waiting to be saved');
    await expect(body).toHaveValue(
      '  Please keep my edits.\nThey are still a draft.  ',
    );
    await expect(page.getByText('Note updated in this browser.')).toHaveCount(
      0,
    );
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual([existing]);
    await inspect(page, `edit-write-error-${width}`);
    await page.evaluate(() => Reflect.get(window, 'restoreNoteWrites')());
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Note updated in this browser.')).toBeVisible();
  });
}

test('modal recovery is non-destructive; stale drafts cannot replace reloaded notes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 960 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ({ key, existing }) =>
      localStorage.setItem(key, JSON.stringify([existing])),
    { key, existing },
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Edit note: Already on paper' })
    .click();
  const dialog = page.getByRole('dialog');
  const body = dialog.getByRole('textbox', { name: /Content/ });
  await body.fill('Keep my unsaved revision');
  await page.evaluate(
    (key) => localStorage.setItem(key, '{broken original'),
    key,
  );
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('unreadable data');
  await expect(body).toHaveValue('Keep my unsaved revision');
  await dialog.getByRole('button', { name: 'Retry loading' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '{broken original',
  );
  expect(
    await dialog.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await expect(
    dialog.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeInViewport();
  await inspect(page, 'edit-recovery-390');
  const external = [{ ...existing, title: 'Changed in another tab' }];
  await page.evaluate(
    ({ key, external }) => localStorage.setItem(key, JSON.stringify(external)),
    { key, external },
  );
  await dialog.getByRole('button', { name: 'Retry loading' }).click();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'changed or is no longer',
  );
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual(external);
  await expect(body).toHaveValue('Keep my unsaved revision');
});

test('closing after recovery removes the opener uses the main-content focus fallback', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, existing }) =>
      localStorage.setItem(key, JSON.stringify([existing])),
    { key, existing },
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Edit note: Already on paper' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: /Content/ })
    .fill('Retain until discarded');
  await page.evaluate((key) => localStorage.setItem(key, '[]'), key);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await dialog.getByRole('button', { name: 'Retry loading' }).click();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Discard edits' }).click();
  await expect(page.getByRole('main')).toBeFocused();
});

test('blank optional titles remain accessible; short viewport scrolls controls into view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  await page.getByRole('textbox', { name: /Title/ }).fill('   ');
  await page
    .getByRole('textbox', { name: /Content/ })
    .fill('A note without a heading');
  await page.getByRole('button', { name: 'Save note' }).click();
  const card = page.getByRole('article', { name: 'Untitled note' });
  await expect(card.getByRole('heading')).toHaveCount(0);
  const opener = card.getByRole('button', { name: 'Edit note: Untitled note' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: /Title/ })).toHaveValue(
    '   ',
  );
  await dialog
    .getByRole('textbox', { name: /Content/ })
    .fill('Changed body only');
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeInViewport();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'Changed body only',
  );
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(opener).toBeFocused();
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir('artifacts/phase3/accessibility', { recursive: true });
  await writeFile(
    'artifacts/phase3/accessibility/blank-title-390.json',
    JSON.stringify(
      {
        url: page.url(),
        violations: axe.violations,
        passes: axe.passes.length,
      },
      null,
      2,
    ),
  );
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
