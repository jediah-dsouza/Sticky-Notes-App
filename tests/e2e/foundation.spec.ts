import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const width of [390, 768, 1440]) {
  for (const route of ['/', '/missing-page']) {
    test(`${route === '/' ? 'workspace' : 'not-found'} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 960 });
      const errors: string[] = [];
      const externalRequests: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('request', (request) => {
        if (!request.url().startsWith('http://127.0.0.1:4173/'))
          externalRequests.push(request.url());
      });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('textbox')).toHaveCount(
        route === '/' ? 2 : 0,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      await mkdir('artifacts/phase3/accessibility', { recursive: true });
      await writeFile(
        `artifacts/phase3/accessibility/foundation-${route === '/' ? 'workspace' : 'not-found'}-${width}.json`,
        JSON.stringify(
          {
            url: page.url(),
            violations: accessibility.violations,
            passes: accessibility.passes.length,
          },
          null,
          2,
        ),
      );
      expect(accessibility.violations).toEqual([]);
      await mkdir('artifacts/screenshots', { recursive: true });
      const image = `artifacts/screenshots/${route === '/' ? 'workspace' : 'not-found'}-${width}.png`;
      await page.screenshot({ path: image, fullPage: true });
      await test
        .info()
        .attach('rendered-page', { path: image, contentType: 'image/png' });
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
    });
  }
}

test('keyboard skip navigation and visible focus work', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  expect(
    await skip.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe('solid');
  expect(
    await skip.evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.goto('/missing');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: /Return to workspace/ }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A little space for your thoughts.',
  );
});

test('reduced motion removes link transitions and dark preference retains approved light theme', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/missing');
  const link = page.getByRole('link', { name: /Return to workspace/ });
  expect(
    await link.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe('0s');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    ),
  ).toBe('rgb(245, 241, 232)');
});

test('explicit in-use token contrast pairs meet AA targets', async ({
  page,
}) => {
  await page.goto('/');
  const pairs = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const luminance = (token: string) => {
      const hex = css.getPropertyValue(token).trim().replace('#', '');
      const channels = [0, 2, 4].map((offset) => {
        const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    return [
      ['--ink', '--canvas', 4.5],
      ['--ink-secondary', '--canvas', 4.5],
      ['--ink', '--surface', 4.5],
      ['--ink-secondary', '--surface', 4.5],
      ['--ink', '--surface-muted', 4.5],
      ['--surface', '--accent', 4.5],
      ['--surface', '--accent-hover', 4.5],
      ['--focus', '--canvas', 3],
      ['--focus', '--surface', 3],
      ['--focus', '--note-cream', 3],
      ['--danger', '--surface', 4.5],
      ['--success', '--surface', 4.5],
      ['--success', '--canvas', 4.5],
      ['--ink', '--note-cream', 4.5],
      ['--ink-secondary', '--note-cream', 4.5],
      ['--control-border', '--surface', 3],
      ['--ink-secondary', '--surface-muted', 4.5],
      ['--danger', '--surface-muted', 4.5],
      ['--surface', '--danger', 4.5],
    ].map(([foreground, background, minimum]) => {
      const a = luminance(String(foreground));
      const b = luminance(String(background));
      return {
        foreground,
        background,
        minimum: Number(minimum),
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
  });
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/contrast.json', JSON.stringify(pairs, null, 2));
  await test.info().attach('contrast-measurements', {
    body: JSON.stringify(pairs, null, 2),
    contentType: 'application/json',
  });
  for (const pair of pairs)
    expect(
      pair.ratio,
      `${pair.foreground} on ${pair.background}`,
    ).toBeGreaterThanOrEqual(pair.minimum);
});
