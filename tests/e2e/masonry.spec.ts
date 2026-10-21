import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { masonryNotes } from './masonry-fixture';
const key = 'sticky-notes:notes:v1';
const root = 'artifacts/phase5';

async function seed(page: Page, notes = masonryNotes) {
  await page.goto('/');
  await page.evaluate(
    ({ key, notes }) => localStorage.setItem(key, JSON.stringify(notes)),
    { key, notes },
  );
  await page.reload();
}
async function geometry(page: Page) {
  return page.getByRole('list').evaluate((list) => ({
    columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
    flow: getComputedStyle(list).gridAutoFlow,
    cards: Array.from(list.querySelectorAll('article')).map((card) => {
      const r = card.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  }));
}
async function layout(page: Page, columns: number) {
  await expect(page.getByRole('list')).toHaveAttribute('data-masonry', 'ready');
  await expect.poll(async () => (await geometry(page)).columns).toBe(columns);
  await expect
    .poll(async () => {
      const { cards } = await geometry(page);
      return cards.every((r, i) => {
        const previous = cards[i - 1];
        const above = cards
          .slice(0, i)
          .filter((a) => a.x === r.x)
          .at(-1);
        const gap = above ? r.y - above.y - above.height : 24;
        return (
          (!previous ||
            r.y > previous.y ||
            (r.y === previous.y && r.x > previous.x)) &&
          gap >= 23.9 &&
          gap < 28.1
        );
      });
    })
    .toBe(true);
  expect((await geometry(page)).flow).toBe('row');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function evidence(
  page: Page,
  state: string,
  width: number,
  screenshot = true,
) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir(`${root}/accessibility`, { recursive: true });
  await writeFile(
    `${root}/accessibility/${state}-${width}.json`,
    JSON.stringify(
      {
        state,
        width,
        violations: result.violations,
        passes: result.passes.length,
      },
      null,
      2,
    ),
  );
  expect(result.violations).toEqual([]);
  if (screenshot) {
    await mkdir(`${root}/after`, { recursive: true });
    await page.screenshot({
      path: `${root}/after/${state}-${width}.png`,
      fullPage: ['empty', 'collection', 'recovery'].includes(state),
    });
  }
}
for (const [width, columns] of [
  [390, 1],
  [768, 2],
  [1440, 3],
]) {
  test(`ordered masonry and lifecycle at ${width}px`, async ({ page }) => {
    const errors: string[] = [],
      external: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1:4173/')) external.push(r.url());
    });
    await page.setViewportSize({ width, height: 960 });
    await seed(page, []);
    await evidence(page, 'empty', width);
    await seed(page);
    await layout(page, columns);
    const before = await geometry(page);
    await writeFile(
      `${root}/geometry-${width}.json`,
      JSON.stringify(before, null, 2),
    );
    for (let i = 0; i < masonryNotes.length; i++) {
      expect(
        await page
          .getByRole('article')
          .nth(i)
          .locator('p')
          .first()
          .textContent(),
      ).toBe(masonryNotes[i].content);
    }
    expect(await page.locator('article img').count()).toBe(0);
    expect(
      await page.evaluate(() => Reflect.get(window, 'noteExecuted')),
    ).toBeUndefined();
    // All actions are always present, 44px+, in chronological DOM/Tab order.
    const actions = page.locator('article button');
    await actions.first().focus();
    for (let i = 0; i < (await actions.count()); i++) {
      await expect(actions.nth(i)).toBeFocused();
      expect(
        (await actions.nth(i).boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
      if (i < (await actions.count()) - 1) await page.keyboard.press('Tab');
    }
    await actions.first().blur();
    await page.evaluate(() => window.scrollTo(0, 0));
    await evidence(page, 'collection', width);
    const first = page.getByRole('article').first();
    await first.getByRole('button', { name: /^Edit note:/ }).click();
    const dialog = page.getByRole('dialog');
    await evidence(page, 'editor', width);
    const content = dialog.getByRole('textbox', { name: /Content/ });
    await content.fill('  \n  ');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(content).toHaveValue('  \n  ');
    await expect(content).toHaveAttribute('aria-invalid', 'true');
    await evidence(page, 'validation', width, false);
    await page.keyboard.press('Escape');
    await evidence(page, 'discard', width, false);
    await page.getByRole('button', { name: 'Keep editing' }).click();
    const long =
      '  A much longer thought.\n\n' +
      'One line at a time.\n'.repeat(24) +
      '  Last line.  ';
    await content.fill(long);
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await layout(page, columns);
    expect((await geometry(page)).cards[0].height).toBeGreaterThan(
      before.cards[0].height + 200,
    );
    await page.reload();
    await expect(first.locator('p').first()).toHaveText(long);
    expect(await first.locator('p').first().textContent()).toBe(long);
    await first.getByRole('button', { name: /^Edit note:/ }).click();
    await content.fill('Short again.');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await layout(page, columns);
    expect((await geometry(page)).cards[0].height).toBeLessThan(
      before.cards[0].height,
    );
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    expect(stored).toHaveLength(6);
    expect(stored[0].id).toBe(masonryNotes[0].id);
    expect(stored[0].createdAt).toBe(masonryNotes[0].createdAt);
    expect(stored[0].updatedAt).not.toBe(masonryNotes[0].updatedAt);
    const opener = first.getByRole('button', { name: /^Delete note:/ });
    await opener.click();
    await evidence(page, 'delete', width);
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual(stored);
    await opener.click();
    await page
      .getByRole('button', { name: 'Delete note', exact: true })
      .click();
    await expect(page.getByRole('article')).toHaveCount(5);
    await layout(page, columns);
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(5);
    // A transient write error never removes the card, and the dialog is retryable.
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Reflect.set(window, 'restoreWrite', () => {
        Storage.prototype.setItem = original;
      });
      Storage.prototype.setItem = () => {
        throw new DOMException('Blocked', 'QuotaExceededError');
      };
    });
    await first.getByRole('button', { name: /^Delete note:/ }).click();
    await page
      .getByRole('button', { name: 'Delete note', exact: true })
      .click();
    await expect(page.getByRole('alertdialog')).toContainText(
      "couldn't be deleted",
    );
    await expect(page.getByRole('article')).toHaveCount(5);
    await evidence(page, 'write-error', width);
    await page.evaluate(() => Reflect.get(window, 'restoreWrite')());
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    // Unsafe changed snapshot is preserved; retain last loaded cards below recovery.
    await first.getByRole('button', { name: /^Delete note:/ }).click();
    await page.evaluate((key) => localStorage.setItem(key, '{broken'), key);
    await page
      .getByRole('button', { name: 'Delete note', exact: true })
      .click();
    await expect(
      page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete note', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await evidence(page, 'recovery', width);
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      '{broken',
    );
    await expect(page.getByRole('article')).toHaveCount(5);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('resize and substantial scrolling retain ordered balanced cards without mutating content', async ({
  page,
}) => {
  const many = Array.from({ length: 48 }, (_, i) => ({
    ...masonryNotes[i % 6],
    id: `many-${String(i).padStart(2, '0')}`,
    title: `Thought ${i}`,
    content: masonryNotes[i % 6].content + '\nA line.\n'.repeat(i % 5),
  }));
  await seed(page, many);
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  for (const [width, columns] of [
    [1440, 3],
    [768, 2],
    [390, 1],
    [1440, 3],
  ]) {
    await page.setViewportSize({ width, height: 480 });
    await layout(page, columns);
    await page
      .getByRole('article')
      .last()
      .getByRole('button', { name: /^Edit note:/ })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: /Title/ })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Save changes' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('textbox', { name: /Title/ })).toBeFocused();
    await dialog
      .getByRole('textbox', { name: /Content/ })
      .fill('A narrow-height draft.');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Discard edits' }).click();
  }
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    raw,
  );
  await page.setViewportSize({ width: 390, height: 480 });
  await page
    .getByRole('article')
    .last()
    .getByRole('button', { name: /^Edit note:/ })
    .click();
  await evidence(page, 'narrow-editor', 390);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('article')
    .last()
    .getByRole('button', { name: /^Delete note:/ })
    .click();
  await evidence(page, 'narrow-delete', 390);
});

test('reduced motion disables optional button transitions without changing masonry', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 960 });
  await seed(page);
  await layout(page, 3);
  expect(
    await page
      .getByRole('article')
      .first()
      .getByRole('button', { name: /^Edit note:/ })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
});

test('without ResizeObserver, readable responsive Grid and actions remain usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'ResizeObserver');
  });
  await seed(page);
  await expect(page.getByRole('list')).not.toHaveAttribute('data-masonry');
  await expect(page.getByRole('article')).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: /^Edit note:/ })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
