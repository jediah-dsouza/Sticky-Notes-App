import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installSpeechMock } from './voice-mock';
const key = 'sticky-notes:notes:v1';
const root = 'artifacts/phase6';
async function evidence(page: Page, state: string, width: number) {
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await mkdir(`${root}/accessibility`, { recursive: true });
  await mkdir(`${root}/screenshots`, { recursive: true });
  await writeFile(
    `${root}/accessibility/${state}-${width}.json`,
    JSON.stringify(
      { state, width, passes: scan.passes.length, violations: scan.violations },
      null,
      2,
    ),
  );
  expect(scan.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${root}/screenshots/${state}-${width}.png`,
    fullPage: true,
  });
}
for (const width of [390, 768, 1440]) {
  test(`voice review, save, reload and safe failure at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    const errors: string[] = [],
      external: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1:4173/')) external.push(r.url());
    });
    await page.addInitScript(installSpeechMock);
    await page.goto('/');
    const composer = page.getByRole('form', { name: 'Make a little note.' });
    const content = composer.getByRole('textbox', { name: /Content/ });
    const save = composer.getByRole('button', { name: 'Save note' });
    await expect(page.getByText('Dictation is ready.')).toBeVisible();
    expect(await page.evaluate(() => window.voiceTest.count())).toBe(0);
    await evidence(page, 'idle', width);
    await content.fill('Typed first.\n');
    await content.focus();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Start dictation' }),
    ).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByText(/Starting dictation/)).toBeVisible();
    await page.evaluate(() => window.voiceTest.listening());
    await expect(page.getByText(/Listening\. Speak/)).toHaveAttribute(
      'aria-live',
      'polite',
    );
    await expect(save).toBeDisabled();
    await page.evaluate(() =>
      window.voiceTest.result([['Provisional words', false]]),
    );
    await expect(content).toHaveValue('Typed first.\n');
    await evidence(page, 'listening', width);
    const markup = '<img src=x onerror=alert(1)>';
    await page.evaluate((markup) => {
      window.voiceTest.result([[markup, true]]);
      window.voiceTest.result([[markup, true]]);
    }, markup);
    await expect(content).toHaveValue(`Typed first.\n${markup}`);
    await content.fill(`Typed first.\n${markup}\nReviewed.`);
    await page.getByRole('button', { name: 'Stop dictation' }).click();
    await expect(page.getByText(/Finishing dictation\. Waiting/)).toBeVisible();
    await evidence(page, 'processing', width);
    await page.evaluate(() => window.voiceTest.end());
    await expect(save).toBeEnabled();
    await evidence(page, 'transcribed', width);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), key),
    ).toBeNull();
    // A denied session never erases the reviewed text or auto-saves it.
    await page.getByRole('button', { name: 'Start dictation' }).click();
    await page.evaluate(() => window.voiceTest.error('not-allowed'));
    await expect(
      page.getByText(/Microphone permission was denied/),
    ).toBeVisible();
    await expect(content).toHaveValue(`Typed first.\n${markup}\nReviewed.`);
    await evidence(page, 'permission-error', width);
    // Resume appends once to the current edited end, then normal storage safeguards apply.
    await page.getByRole('button', { name: 'Start dictation' }).click();
    await page.evaluate(() => {
      window.voiceTest.result([['Resumed.', true]]);
      window.voiceTest.end();
    });
    const expected = `Typed first.\n${markup}\nReviewed.\nResumed.`;
    await expect(content).toHaveValue(expected);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        Storage.prototype.setItem = original;
        throw new DOMException(`${key}:${value.length}`, 'QuotaExceededError');
      };
    });
    await save.click();
    await expect(composer.getByRole('alert')).toHaveText(/couldn't be saved/);
    await expect(content).toHaveValue(expected);
    await expect(
      page.getByText('Note saved in this browser.', { exact: true }),
    ).toHaveCount(0);
    await save.click();
    await expect(page.getByRole('article')).toHaveText(/Reviewed/);
    await expect(page.locator('article img')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('article')).toContainText(markup);
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!)[0].content,
        key,
      ),
    ).toBe(expected);
    // Retain editing and safe cancellation/deletion after a voice-created note.
    await page.getByRole('button', { name: 'Start dictation' }).click();
    await page.evaluate(() => window.voiceTest.listening());
    await page.getByRole('button', { name: 'Edit note' }).click();
    await expect(page.getByText(/left the composer or page/)).toBeAttached();
    const editor = page.getByRole('dialog', { name: 'Edit your note.' });
    await expect(editor.getByRole('textbox', { name: /Content/ })).toHaveValue(
      expected,
    );
    await editor.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: /^Delete note:/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('button', { name: /^Delete note:/ }).click();
    await page
      .getByRole('button', { name: 'Delete note', exact: true })
      .click();
    await page.reload();
    await expect(page.getByText('A fresh sheet.')).toBeVisible();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
  test(`unsupported voice preserves typing at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'SpeechRecognition', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: undefined,
        configurable: true,
      });
    });
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Dictation unavailable' }),
    ).toBeDisabled();
    await expect(page.getByText(/Voice input isn’t available/)).toBeVisible();
    await evidence(page, 'unsupported', width);
    await page
      .getByRole('textbox', { name: /Content/ })
      .fill('Typing is always here.');
    await page.getByRole('button', { name: 'Save note' }).click();
    await page.reload();
    await expect(page.getByRole('article')).toContainText(
      'Typing is always here.',
    );
  });
}
test('dictation respects reduced motion and stops when the page is hidden', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(installSpeechMock);
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Start dictation' });
  expect(
    await start.evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe('0s');
  await start.click();
  await page.evaluate(() => {
    window.voiceTest.listening();
    window.voiceTest.result([['Keep this.', true]]);
    window.dispatchEvent(new Event('pagehide'));
  });
  await expect(page.getByText(/left the composer or page/)).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Content/ })).toHaveValue(
    'Keep this.',
  );
  await expect(start).toBeEnabled();
});

test('native capability is inspected without activating recognition', async ({
  page,
}) => {
  await page.goto('/');
  const capability = await page.evaluate(() => ({
    secureContext: window.isSecureContext,
    standard: typeof Reflect.get(window, 'SpeechRecognition'),
    prefixed: typeof Reflect.get(window, 'webkitSpeechRecognition'),
    userAgent: navigator.userAgent,
  }));
  await writeFile(
    `${root}/native-capability.json`,
    JSON.stringify(
      { ...capability, microphoneActivated: false, realAudioTested: false },
      null,
      2,
    ),
  );
  const available =
    capability.secureContext &&
    (capability.standard === 'function' || capability.prefixed === 'function');
  await expect(
    page.getByRole('button', {
      name: available ? 'Start dictation' : 'Dictation unavailable',
    }),
  ).toBeVisible();
});

test('primary action keeps AA contrast throughout dictation completion', async ({
  page,
}) => {
  await page.addInitScript(installSpeechMock);
  await page.goto('/');
  await page
    .getByRole('textbox', { name: /Content/ })
    .fill('Review before saving.');
  await page.getByRole('button', { name: 'Start dictation' }).click();
  await page.evaluate(() => window.voiceTest.listening());
  await page.getByRole('button', { name: 'Stop dictation' }).click();
  const save = page.getByRole('button', { name: 'Save note' });
  await expect(save).toBeDisabled();
  const samples = await save.evaluate(async (button: HTMLButtonElement) => {
    const luminance = (value: string) => {
      const channels = value
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    // Flush the actual disabled style before the recognition end changes it.
    void getComputedStyle(button).backgroundColor;
    window.voiceTest.end();
    const ratios: number[] = [];
    for (let frame = 0; frame < 12; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (button.disabled) continue;
      const style = getComputedStyle(button);
      const a = luminance(style.color),
        b = luminance(style.backgroundColor);
      ratios.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
    }
    return ratios;
  });
  expect(samples.length).toBeGreaterThanOrEqual(2);
  expect(Math.min(...samples)).toBeGreaterThanOrEqual(4.5);
  await expect(save).toBeEnabled();
  await expect(save).toHaveCSS('transition-duration', '0s');
  await mkdir('artifacts/phase8/verification', { recursive: true });
  await writeFile(
    'artifacts/phase8/verification/contrast-regression.json',
    JSON.stringify({ samples, minimum: Math.min(...samples) }, null, 2),
  );
});
