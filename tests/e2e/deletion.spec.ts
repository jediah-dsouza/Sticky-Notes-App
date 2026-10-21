import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
const key = 'sticky-notes:notes:v1';
const selected = {
  id: 'selected',
  title: 'One small thought',
  content: 'A note to let go.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const remaining = {
  ...selected,
  id: 'remaining',
  title: 'Keep on paper',
  content: 'This note stays exactly as it was.',
  updatedAt: '2026-01-02T00:00:00.000Z',
};
const raw = JSON.stringify([selected, remaining]);
async function seed(page: Page, width: number) {
  await page.setViewportSize({ width, height: 960 });
  await page.goto('/');
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key,
    raw,
  });
  await page.reload();
}
const modal = (page: Page) =>
  page.getByRole('alertdialog', { name: 'Delete this note?' });
const confirm = (page: Page) =>
  modal(page).getByRole('button', { name: 'Delete note', exact: true });
const opener = (page: Page) =>
  page.getByRole('button', { name: 'Delete note: One small thought' });
const stored = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), key);
async function inspect(page: Page, name: string, isModal = true) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (isModal) {
    const bounds = (await modal(page).boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
    expect(
      await modal(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const buttons = await modal(page).getByRole('button').all();
    for (const button of buttons) {
      await button.scrollIntoViewIfNeeded();
      const control = (await button.boundingBox())!;
      expect(control.y).toBeGreaterThanOrEqual(0);
      expect(control.y + control.height).toBeLessThanOrEqual(
        page.viewportSize()!.height,
      );
    }
  }
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir('artifacts/phase4/accessibility', { recursive: true });
  await writeFile(
    `artifacts/phase4/accessibility/${name}.json`,
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
  await mkdir('artifacts/phase4/screenshots', { recursive: true });
  const path = `artifacts/phase4/screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: !isModal });
  await test.info().attach(name, { path, contentType: 'image/png' });
}
for (const width of [390, 768, 1440]) {
  test(`safe confirmation, cancellation, deletion and last-note reload at ${width}px`, async ({
    page,
  }) => {
    await seed(page, width);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await opener(page).focus();
    await page.keyboard.press('Enter');
    const cancel = modal(page).getByRole('button', { name: 'Cancel' });
    await expect(cancel).toBeFocused();
    // Native modality must prevent focus moving into the background composer.
    await page
      .locator('input')
      .first()
      .evaluate((element) => element.focus());
    await expect(cancel).toBeFocused();
    await expect(modal(page)).toHaveAttribute('aria-modal', 'true');
    expect(await stored(page)).toBe(raw);
    await page.keyboard.press('Shift+Tab');
    await expect(confirm(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    expect(
      await cancel.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
    await inspect(page, `confirmation-${width}`);
    await page.keyboard.press('Enter');
    await expect(modal(page)).toHaveCount(0);
    await expect(opener(page)).toBeFocused();
    expect(await stored(page)).toBe(raw);
    await inspect(page, `cancelled-${width}`, false);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(modal(page)).toHaveCount(0);
    await expect(opener(page)).toBeFocused();
    expect(await stored(page)).toBe(raw);
    await opener(page).click();
    await page.mouse.click(2, 2);
    await expect(modal(page)).toHaveCount(0);
    expect(await stored(page)).toBe(raw);
    await opener(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(modal(page)).toHaveCount(0);
    await expect(
      page.getByRole('article', { name: selected.title, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Your notes' }),
    ).toBeFocused();
    await expect(
      page.getByText('Note deleted from this browser.'),
    ).toBeVisible();
    expect(JSON.parse((await stored(page))!)).toEqual([remaining]);
    await inspect(page, `deleted-${width}`, false);
    await page.reload();
    expect(JSON.parse((await stored(page))!)).toEqual([remaining]);
    await expect(
      page.getByRole('article', { name: remaining.title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Delete note: Keep on paper' })
      .click();
    await confirm(page).click();
    await expect(
      page.getByRole('heading', { name: 'A fresh sheet.' }),
    ).toBeFocused();
    await inspect(page, `empty-${width}`, false);
    expect(await stored(page)).toBe('[]');
    await page.reload();
    await expect(page.getByText('0 notes')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
  test(`delete write failure retains note and permits explicit retry at ${width}px`, async ({
    page,
  }) => {
    await seed(page, width);
    await opener(page).click();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Object.assign(window, {
        restoreDeleteWrite: () => {
          Storage.prototype.setItem = original;
        },
      });
      Storage.prototype.setItem = function (key, value) {
        if (key === 'sticky-notes:notes:v1')
          throw new DOMException('Full', 'QuotaExceededError');
        original.call(this, key, value);
      };
    });
    await confirm(page).click();
    await expect(modal(page).getByRole('alert')).toContainText(
      "couldn't be deleted",
    );
    expect(await stored(page)).toBe(raw);
    await expect(page.getByText('Note deleted from this browser.')).toHaveCount(
      0,
    );
    expect(await page.locator('article').count()).toBe(2);
    await inspect(page, `write-error-${width}`);
    await page.evaluate(() =>
      (
        window as unknown as { restoreDeleteWrite: () => void }
      ).restoreDeleteWrite(),
    );
    await confirm(page).click();
    await expect(modal(page)).toHaveCount(0);
    expect(JSON.parse((await stored(page))!)).toEqual([remaining]);
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(1);
  });
  test(`delete recovery never repairs unreadable data at ${width}px`, async ({
    page,
  }) => {
    await seed(page, width);
    await opener(page).click();
    await page.evaluate((key) => localStorage.setItem(key, '{unreadable'), key);
    await confirm(page).click();
    await expect(confirm(page)).toBeDisabled();
    await expect(modal(page).getByRole('alert')).toContainText('unreadable');
    await inspect(page, `recovery-${width}`);
    await modal(page).getByRole('button', { name: 'Retry loading' }).click();
    expect(await stored(page)).toBe('{unreadable');
    await expect(confirm(page)).toBeDisabled();
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    });
    await modal(page).getByRole('button', { name: 'Retry loading' }).click();
    await expect(confirm(page)).toBeEnabled();
    expect(await stored(page)).toBe(raw);
    await confirm(page).click();
    expect(JSON.parse((await stored(page))!)).toEqual([remaining]);
  });
}
test('stale target cannot be deleted after retry and cancellation has a missing-opener fallback', async ({
  page,
}) => {
  await seed(page, 390);
  await opener(page).click();
  await page.evaluate(
    ({ key, remaining }) =>
      localStorage.setItem(key, JSON.stringify([remaining])),
    { key, remaining },
  );
  await confirm(page).click();
  await modal(page).getByRole('button', { name: 'Retry loading' }).click();
  await confirm(page).click();
  await expect(modal(page).getByRole('alert')).toContainText(
    'changed or is no longer available',
  );
  expect(JSON.parse((await stored(page))!)).toEqual([remaining]);
  await modal(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Your notes' })).toBeFocused();
});
test('delete confirmation respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, 390);
  await opener(page).click();
  expect(
    await modal(page).evaluate((el) => getComputedStyle(el).animationDuration),
  ).toBe('0s');
  expect(
    await confirm(page).evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    ),
  ).toBe('0s');
  await page.setViewportSize({ width: 390, height: 600 });
  await page.evaluate((key) => localStorage.setItem(key, '{unreadable'), key);
  await confirm(page).click();
  await expect(confirm(page)).toBeDisabled();
  const cancel = modal(page).getByRole('button', { name: 'Cancel' });
  for (const button of [cancel, confirm(page)]) {
    const bounds = (await button.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(600);
  }
  await modal(page).getByRole('button', { name: 'Retry loading' }).focus();
  await expect(
    modal(page).getByRole('button', { name: 'Retry loading' }),
  ).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(opener(page)).toBeFocused();
});
