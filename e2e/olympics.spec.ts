import { expect, test } from '@playwright/test';

test('home → France → Italy → history → home reuses the JSON response', async ({ page }) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/assets/mock/olympic.json')) requests++;
  });
  await page.goto('./');
  await expect(page.getByRole('rowheader', { name: /France/ })).toContainText('France');
  await page.getByRole('link', { name: 'France' }).click();
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('app-header dd')).toHaveText(['3', '113', '1238']);
  await page.getByRole('button', { name: 'Country', exact: true }).click();
  await page.getByRole('button', { name: 'Italy', exact: true }).click();
  await expect(page).toHaveTitle('Italy | Olympic Games');
  await page.goBack();
  await expect(page).toHaveTitle('France | Olympic Games');
  await page.goForward();
  await expect(page).toHaveTitle('Italy | Olympic Games');
  await page.getByRole('link', { name: 'Home — TéléSport' }).click();
  await expect(page).toHaveTitle('Medals by country | Olympic Games');
  expect(requests).toBe(1);
});

test('a mouse click on a medal sector opens its associated country', async ({ page }) => {
  await page.goto('./');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Expected a visible canvas.');
  const left = bounds.width >= 520 ? 145 : 10;
  const right = bounds.width >= 520 ? 90 : 10;
  const radius = Math.min(bounds.width - left - right, bounds.height - 30) / 2;
  const angle = (-65 * Math.PI) / 180;
  await canvas.click({
    position: {
      x: (bounds.width + left - right) / 2 + Math.cos(angle) * radius * 0.55,
      y: bounds.height / 2 + Math.sin(angle) * radius * 0.55,
    },
  });
  await expect(page).toHaveTitle('Italy | Olympic Games');
});

test('a direct country URL survives reload under the production prefix', async ({ page }) => {
  const response = await page.goto('country/5');
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).hash).toBe('');
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();
  await page.reload();
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('app-header dd')).toHaveText(['3', '113', '1238']);
});

test('unknown routes and absent or invalid countries use the same not-found page', async ({
  page,
}) => {
  for (const route of ['unknown/nested', 'country/invalid', 'country/999', 'country/5999']) {
    await page.goto(route);
    await expect(page).toHaveTitle('Page not found | Olympic Games');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page n’existe pas');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('app-header')).toHaveCount(0);
    if (route.startsWith('country/')) await expect(page).toHaveURL(/\/not-found$/);
    await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toBeVisible();
    await expect(page.getByText('Country not found', { exact: false })).toHaveCount(0);
  }
});

test('a failed HTTP load displays a safe error and recovers on another country', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/assets/mock/olympic.json', async (route) => {
    if (fail) await route.fulfill({ status: 503, body: 'private server details' });
    else await route.continue();
  });
  await page.goto('country/5');
  await expect(page.getByRole('alert')).toHaveText(
    'Olympic data is temporarily unavailable. Please try again later.',
  );
  await expect(page.locator('body')).not.toContainText('private server details');
  await expect(page.locator('canvas')).toHaveCount(0);
  fail = false;
  await page.evaluate(() => {
    history.pushState(null, '', new URL('country/1', document.baseURI));
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveTitle('Italy | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();
});

test('empty data and a country without participations retain their distinct meaning', async ({
  page,
}) => {
  await page.route('**/assets/mock/olympic.json', (route) => route.fulfill({ json: [] }));
  await page.goto('./');
  await expect(page.getByRole('status')).toHaveText('No Olympic data available.');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.unroute('**/assets/mock/olympic.json');
  await page.route('**/assets/mock/olympic.json', (route) =>
    route.fulfill({ json: [{ id: 5, country: 'France', participations: [] }] }),
  );
  await page.goto('country/5');
  await page.reload();
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('app-header dd')).toHaveText(['0', '0', '0']);
  await expect(page.getByRole('status')).toHaveText('No Olympic data available.');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('the chart supports keyboard selection and focus exits at both boundaries', async ({
  page,
}) => {
  await page.goto('./');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await canvas.focus();
  await page.keyboard.press('End');
  await expect(page.locator('.olympic-chart__selection')).toHaveText('France: 113 medals');
  await page.keyboard.press('Enter');
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('h1')).toBeFocused();
  await expect(canvas).toBeVisible();
  await canvas.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.olympic-chart__selection')).toHaveText('2016: 45 medals');
  await page.keyboard.press('Tab');
  await expect(page.locator('.olympic-chart__selection')).toHaveText('2020: 33 medals');
  await page.keyboard.press('Tab');
  await expect(canvas).not.toBeFocused();
  await canvas.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+Tab');
  await expect(canvas).not.toBeFocused();
});

for (const width of [320, 768, 1280]) {
  test(`home and France stay readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, route] of [
      ['home', './'],
      ['france', 'country/5'],
    ]) {
      await page.goto(route);
      await expect(page.locator('canvas')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('app-header dd')).toHaveCount(name === 'home' ? 2 : 3);
      await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
      await testInfo.attach(`${name}-${width}`, {
        path: testInfo.outputPath(`${name}-${width}.png`),
        contentType: 'image/png',
      });
    }
  });
}

test('country dropdown supports Tab, Enter, Escape and outside dismissal', async ({
  page,
}, testInfo) => {
  await page.goto('country/5');
  const trigger = page.getByRole('button', { name: 'Country', exact: true });
  await expect(page).toHaveTitle('France | Olympic Games');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dropdown = page.locator('#country-options');
  await expect(dropdown).toBeVisible();
  await expect(dropdown.getByRole('button', { name: 'France', exact: true })).toHaveCount(0);
  await expect(dropdown.getByRole('button')).toHaveCount(4);
  expect(await dropdown.evaluate((element) => element.scrollHeight)).toBeLessThanOrEqual(
    await dropdown.evaluate((element) => element.clientHeight),
  );
  const triggerBounds = await trigger.boundingBox();
  const dropdownBounds = await dropdown.boundingBox();
  expect(dropdownBounds!.y).toBeGreaterThanOrEqual(triggerBounds!.y + triggerBounds!.height);
  await page.screenshot({ path: testInfo.outputPath('country-dropdown-desktop.png') });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Italy', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dropdown).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveTitle('Italy | Olympic Games');
  await expect(dropdown).not.toBeVisible();
  await trigger.click();
  await expect(dropdown).toBeVisible();
  await page.getByRole('heading', { name: 'Olympic results', exact: true }).click();
  await expect(dropdown).not.toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  await trigger.click();
  await expect(dropdown.getByRole('button', { name: 'Italy', exact: true })).toHaveCount(0);
  expect(await dropdown.evaluate((element) => element.scrollHeight)).toBeLessThanOrEqual(
    await dropdown.evaluate((element) => element.clientHeight),
  );
  const mobileBounds = await dropdown.boundingBox();
  expect(mobileBounds!.x).toBeGreaterThanOrEqual(0);
  expect(mobileBounds!.x + mobileBounds!.width).toBeLessThanOrEqual(320);
});

test('header text is reachable with Tab and the home heading stays stable', async ({ page }) => {
  await page.goto('./');
  const homeLink = page.getByRole('link', { name: 'Home — TéléSport' });
  const title = page.locator('.brand__title');
  const description = page.locator('.brand__description');
  const heading = page.locator('[data-page-heading]');
  await homeLink.focus();
  await page.keyboard.press('Tab');
  await expect(title).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(title).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(description).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(heading).toBeFocused();
  await expect(heading).toHaveText('Medals per Country');
  await expect(page.locator('#home-page-title')).toHaveCSS('clip-path', 'inset(50%)');
  await expect(page.locator('#home-page-title')).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Shift+Tab');
  await expect(description).toBeFocused();
  await page.goto('country/5');
  await homeLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveTitle('Medals by country | Olympic Games');
  await expect(heading).toBeFocused();
  await expect(heading).toHaveText('Medals per Country');
});

test('the entire country banner links back to home', async ({ page }, testInfo) => {
  for (const position of [
    { x: 12, y: 12 },
    { x: 300, y: 90 },
  ]) {
    await page.goto('country/5');
    await expect(page).toHaveTitle('France | Olympic Games');
    await expect(page.locator('.brand__name')).toHaveText('TéléSport');
    await expect(page.locator('.brand__title')).toHaveText('Olympic games app');
    await expect(page.locator('.brand__content')).toHaveCSS('position', 'relative');
    await page.screenshot({ path: testInfo.outputPath('country-header.png') });
    await page.locator('.brand__hero').click({ position });
    await expect(page).toHaveTitle('Medals by country | Olympic Games');
    await expect(page.locator('[data-page-heading]')).toBeFocused();
  }
});

for (const route of ['./', 'country/5']) {
  test(`critical styles keep ${route} stable while the stylesheet is delayed`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.addInitScript(() => {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) cls += shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      Object.defineProperty(window, '__cls', { get: () => cls });
    });
    await page.route('**/styles-*.css', async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await request.continue();
    });
    const stylesheet = page.waitForResponse((response) =>
      /\/styles-[^/]+\.css$/.test(response.url()),
    );
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas')).toBeVisible();
    await (await stylesheet).finished();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    const cls = await page.evaluate(() => Reflect.get(window, '__cls') as number);
    expect(cls, 'Late CSS must not move the page').toBeLessThan(0.01);
  });
}

test('not-found shares the banner and offers a responsive return home', async ({
  page,
}, testInfo) => {
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('unknown/nested');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page n’existe pas');
    await expect(page.locator('app-root')).toHaveClass(/app-shell--dashboard/);
    await expect(page.locator('.not-found__illustration')).toBeVisible();
    await expect(page.getByText('Ou découvre')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 1280) {
      await page.screenshot({ path: testInfo.outputPath('not-found-desktop.png'), fullPage: true });
    }
    await page.getByRole('link', { name: 'Retour à l’accueil' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveTitle('Medals by country | Olympic Games');
    await expect(page.locator('canvas')).toBeVisible();
  }
});
