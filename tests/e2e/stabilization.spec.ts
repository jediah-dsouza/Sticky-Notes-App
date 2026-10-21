import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installSpeechMock } from './voice-mock';

const root = 'artifacts/phase8';
const key = 'sticky-notes:notes:v1';
const composer = (page: Page) =>
  page.getByRole('form', { name: 'Make a little note.' });
async function scan(page: Page, state: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir(`${root}/accessibility`, { recursive: true });
  await writeFile(
    `${root}/accessibility/${state}.json`,
    JSON.stringify(
      { state, violations: result.violations, passes: result.passes.length },
      null,
      2,
    ),
  );
  expect(result.violations).toEqual([]);
}
async function screenshot(page: Page, state: string) {
  await mkdir(`${root}/screenshots`, { recursive: true });
  await page.screenshot({ path: `${root}/screenshots/${state}.png` });
}

for (const width of [390, 768, 1440]) {
  test(`system-color controls, keyboard dialogs and both former diagnostics at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 480 : 960 });
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.goto('/');
    const form = composer(page);
    await form.getByRole('textbox', { name: /Content/ }).fill('Retained note.');
    const save = form.getByRole('button', { name: 'Save note' });
    const palette = await save.evaluate((button) => {
      const style = getComputedStyle(button);
      return {
        color: style.color,
        textFill: style.webkitTextFillColor,
        background: style.backgroundColor,
        adjust: style.forcedColorAdjust,
      };
    });
    expect(palette.adjust).toBe('auto');
    expect(palette.textFill).toBe(palette.color);
    expect(palette.color).not.toBe(palette.background);
    await save.focus();
    await expect(save).toHaveCSS('outline-style', 'solid');
    await expect(save).toHaveCSS('outline-width', '3px');
    await scan(page, `forced-composer-${width}`);
    await save.press('Enter');
    await expect(page.getByRole('article')).toHaveCount(1);
    const opener = page.getByRole('button', { name: /^Edit note:/ });
    await opener.focus();
    await opener.press('Enter');
    const dialog = page.getByRole('dialog');
    const title = dialog.getByRole('textbox', { name: /Title/ });
    await expect(title).toBeFocused();
    await scan(page, `forced-editor-${width}`);
    await screenshot(page, `forced-editor-${width}`);
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Save changes' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(title).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await scan(page, `forced-post-dismissal-${width}`);
    await screenshot(page, `forced-post-dismissal-${width}`);
    await page.getByRole('button', { name: /^Delete note:/ }).press('Enter');
    const confirmation = page.getByRole('alertdialog');
    await expect(
      confirmation.getByRole('button', { name: 'Cancel' }),
    ).toBeFocused();
    await confirmation
      .getByRole('button', { name: 'Delete note', exact: true })
      .hover();
    await scan(page, `forced-delete-${width}`);
    await page.keyboard.press('Escape');
    await expect(confirmation).toHaveCount(0);
    await expect(page.getByRole('article')).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test('forced colors preserve disabled storage safeguards and unsupported typing fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: undefined,
      configurable: true,
    });
    localStorage.setItem('sticky-notes:notes:v1', '{broken');
  });
  await page.setViewportSize({ width: 390, height: 960 });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/');
  const form = composer(page);
  await form.getByRole('textbox', { name: /Content/ }).fill('Still editable.');
  await expect(form.getByRole('button', { name: 'Save note' })).toBeDisabled();
  await expect(
    form.getByRole('button', { name: 'Dictation unavailable' }),
  ).toBeDisabled();
  const disabled = await form
    .getByRole('button', { name: 'Save note' })
    .evaluate((button) => {
      const style = getComputedStyle(button);
      const probe = document.createElement('button');
      probe.style.color = 'GrayText';
      probe.disabled = true;
      document.body.append(probe);
      const gray = getComputedStyle(probe).color;
      probe.remove();
      return { color: style.color, textFill: style.webkitTextFillColor, gray };
    });
  expect(disabled.color).toBe(disabled.gray);
  expect(disabled.textFill).toBe(disabled.color);
  await scan(page, 'forced-disabled-recovery');
  await form
    .getByRole('button', { name: 'Save note' })
    .scrollIntoViewIfNeeded();
  await screenshot(page, 'forced-disabled-recovery');
  await page.getByRole('button', { name: 'Retry loading' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '{broken',
  );
  await expect(form.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'Still editable.',
  );
});

test('two actual tabs preserve raw data and drafts through stale create and stale edit', async ({
  page,
  context,
}) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await composer(page)
    .getByRole('textbox', { name: /Content/ })
    .fill('Saved in A.');
  await composer(page).getByRole('button', { name: 'Save note' }).click();
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  await composer(other)
    .getByRole('textbox', { name: /Content/ })
    .fill('Draft in B.');
  await composer(other).getByRole('button', { name: 'Save note' }).click();
  await expect(other.getByText('Saved notes need attention.')).toBeVisible();
  expect(await other.evaluate((key) => localStorage.getItem(key), key)).toBe(
    raw,
  );
  await expect(
    composer(other).getByRole('textbox', { name: /Content/ }),
  ).toHaveValue('Draft in B.');
  await other.getByRole('button', { name: 'Retry loading' }).click();
  await expect(other.getByRole('article')).toHaveCount(1);
  await composer(other).getByRole('button', { name: 'Save note' }).click();
  await expect(other.getByRole('article')).toHaveCount(2);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page
    .getByRole('button', { name: /^Edit note:/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: /Content/ })
    .fill('Unsaved edit in A.');
  await composer(other)
    .getByRole('textbox', { name: /Content/ })
    .fill('Another note in B.');
  await composer(other).getByRole('button', { name: 'Save note' }).click();
  const latest = await other.evaluate((key) => localStorage.getItem(key), key);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    latest,
  );
  await expect(dialog.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'Unsaved edit in A.',
  );
  await scan(page, 'two-tab-edit-conflict');
  await other.close();
});

test('empty speech events and an interrupted resumed session never save or erase the draft', async ({
  page,
}) => {
  await page.addInitScript(installSpeechMock);
  await page.goto('/');
  const form = composer(page);
  const content = form.getByRole('textbox', { name: /Content/ });
  await content.fill('Typed first.');
  await form.getByRole('button', { name: 'Start dictation' }).click();
  await page.evaluate(() => {
    window.voiceTest.listening();
    window.voiceTest.result([]);
    window.voiceTest.result([['  ', true]]);
    window.voiceTest.end();
  });
  await expect(content).toHaveValue('Typed first.');
  await expect(page.getByRole('article')).toHaveCount(0);
  await form.getByRole('button', { name: 'Start dictation' }).click();
  await page.evaluate(() => {
    window.voiceTest.listening();
    window.voiceTest.result([['Final words.', true]]);
    window.voiceTest.result([['Final words.', true]]);
    window.voiceTest.error('aborted');
  });
  await expect(content).toHaveValue('Typed first.\nFinal words.');
  await expect(page.getByText(/Dictation was interrupted/)).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await content.fill('Reviewed.\nFinal words.');
  await form.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText(
    'Reviewed.\nFinal words.',
  );
});

test('fresh unmocked page loads without console errors or failed resources', async ({
  page,
}) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => failed.push(request.url()));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'href',
    'data:,',
  );
  await expect(
    composer(page).getByRole('textbox', { name: /Content/ }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
