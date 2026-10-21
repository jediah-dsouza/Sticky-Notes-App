import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const key = 'sticky-notes:notes:v1';
const existing = {
  id: 'existing-id',
  title: 'Already on paper',
  content: 'This saved note must remain safe.',
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};
const content =
  '  A thought for tomorrow.\n\nLeave a little room for what matters.  \nhttps://example.test/' +
  'longword'.repeat(12) +
  '\n<img src=x onerror="window.noteExecuted=true">';

async function inspectState(page: Page, name: string) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir('artifacts/phase3/accessibility', { recursive: true });
  await writeFile(
    `artifacts/phase3/accessibility/create-${name}.json`,
    JSON.stringify(
      {
        url: page.url(),
        violations: results.violations,
        passes: results.passes.length,
      },
      null,
      2,
    ),
  );
  expect(results.violations).toEqual([]);
  await mkdir('artifacts/phase2/screenshots', { recursive: true });
  const path = `artifacts/phase2/screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

for (const width of [390, 768, 1440]) {
  test(`keyboard create, validation, exact persistence and reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'A fresh sheet.' }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), key),
    ).toBeNull();
    await inspectState(page, `empty-${width}`);
    // Real Tab/Enter navigation, not a synthetic click-only keyboard claim.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const title = page.getByRole('textbox', { name: /Title/ });
    const body = page.getByRole('textbox', { name: /Content/ });
    await expect(title).toBeFocused();
    await page.keyboard.type('A small beginning');
    await page.keyboard.press('Tab');
    await expect(body).toBeFocused();
    await page.keyboard.press('Tab');
    const dictation = page.getByRole('button', { name: 'Start dictation' });
    if (await dictation.count()) {
      await expect(dictation).toBeFocused();
      await page.keyboard.press('Tab');
    }
    await expect(page.getByRole('button', { name: 'Save note' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(body).toBeFocused();
    await expect(body).toHaveAttribute('aria-invalid', 'true');
    await expect(body).toHaveAccessibleDescription(/Write something/);
    expect(
      await body.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('solid');
    await inspectState(page, `validation-${width}`);
    await page.keyboard.insertText(content);
    await page.keyboard.press('Tab');
    if (await dictation.count()) {
      await expect(dictation).toBeFocused();
      await page.keyboard.press('Tab');
    }
    await expect(page.getByRole('button', { name: 'Save note' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText(
      'Note saved in this browser.',
    );
    await expect(title).toHaveValue('');
    await expect(body).toHaveValue('');
    const card = page.getByRole('article', { name: 'A small beginning' });
    await expect(card).toHaveCount(1);
    expect(await card.locator('p').first().textContent()).toBe(content);
    expect(await card.locator('img, script').count()).toBe(0);
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(saved[0].createdAt).toBe(saved[0].updatedAt);
    expect(Object.keys(saved[0]).sort()).toEqual([
      'content',
      'createdAt',
      'id',
      'title',
      'updatedAt',
    ]);
    await inspectState(page, `saved-${width}`);
    await page.reload();
    await expect(card).toBeVisible();
    expect(await card.locator('p').first().textContent()).toBe(content);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual(saved);
    expect(
      await page.evaluate(() => Reflect.get(window, 'noteExecuted')),
    ).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test(`quota failure preserves previous notes and draft, retry succeeds at ${width}px`, async ({
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
              'Deterministic test quota failure',
              'QuotaExceededError',
            );
          original.call(this, name, value);
        };
        Object.defineProperty(window, 'restoreNoteWrites', {
          value: () => {
            Storage.prototype.setItem = original;
          },
        });
      },
      { key, existing },
    );
    await page.goto('/');
    const title = page.getByRole('textbox', { name: /Title/ });
    const body = page.getByRole('textbox', { name: /Content/ });
    await title.fill('Still a draft');
    await body.fill('  Please keep this draft.\nIt has not been saved.  ');
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByRole('alert')).toContainText("couldn't be saved");
    await expect(page.getByRole('status')).not.toContainText('Note saved');
    await expect(title).toHaveValue('Still a draft');
    await expect(body).toHaveValue(
      '  Please keep this draft.\nIt has not been saved.  ',
    );
    await expect(page.getByRole('article')).toHaveCount(1);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual([existing]);
    await inspectState(page, `write-error-${width}`);
    await page.evaluate(() => Reflect.get(window, 'restoreNoteWrites')());
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(body).toHaveValue('');
    await expect(page.getByRole('status')).toContainText('Note saved');
  });

  test(`malformed storage blocks mutations and stays unchanged at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.addInitScript(
      ({ key }) => localStorage.setItem(key, '{broken original'),
      { key },
    );
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('unreadable data');
    await expect(
      page.getByRole('button', { name: 'Save note' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('heading', { name: 'A fresh sheet.' }),
    ).toHaveCount(0);
    const body = page.getByRole('textbox', { name: /Content/ });
    await body.fill('You can still write and copy this draft.');
    await page.getByRole('button', { name: 'Retry loading' }).click();
    await expect(body).toHaveValue('You can still write and copy this draft.');
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      '{broken original',
    );
    await inspectState(page, `recovery-${width}`);
  });
}

test('content-only note is saved once and whitespace-only drafts are rejected', async ({
  page,
}) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: /Content/ });
  await body.fill('  \n\t ');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByRole('alert')).toContainText('Write something');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  await body.fill('No title needed');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(
    page.getByRole('article', { name: 'Untitled note' }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('article', { name: 'Untitled note' }),
  ).toBeVisible();
});

test('read exceptions do not masquerade as empty storage and retry is non-destructive', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, existing }) => {
      localStorage.setItem(key, JSON.stringify([existing]));
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (name) {
        if (name === key)
          throw new DOMException('Deterministic read failure', 'SecurityError');
        return original.call(this, name);
      };
      Object.defineProperty(window, 'restoreNoteReads', {
        value: () => {
          Storage.prototype.getItem = original;
        },
      });
    },
    { key, existing },
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText("couldn't be read");
  await expect(
    page.getByRole('heading', { name: 'A fresh sheet.' }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save note' })).toBeDisabled();
  await page
    .getByRole('textbox', { name: /Content/ })
    .fill('Draft during recovery');
  await page.evaluate(() => Reflect.get(window, 'restoreNoteReads')());
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(
    page.getByRole('article', { name: 'Already on paper' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'Draft during recovery',
  );
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual([existing]);
});
