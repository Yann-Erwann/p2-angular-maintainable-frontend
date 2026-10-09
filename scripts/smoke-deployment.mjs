import { chromium, expect } from '@playwright/test';

const base = process.argv[2];
if (!base) throw new Error('Usage: node scripts/smoke-deployment.mjs <base-url>');
for (const route of ['', '#/country/5', 'assets/mock/olympic.json']) {
  const url = new URL(route, base.endsWith('/') ? base : base + '/');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Deployment check failed: ${url} (${response.status})`);
  if (route.endsWith('.json')) {
    const countries = await response.json();
    if (!Array.isArray(countries) || !countries.some((country) => country.id === 5)) {
      throw new Error('The deployed Olympic collection does not contain France.');
    }
  } else {
    const html = await response.text();
    if (!html.includes('<app-root') || !html.includes('type="module"')) {
      throw new Error('The deployed HTML is missing the Angular bootstrap.');
    }
  }
  console.log(`OK ${url}`);
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const page = await browser.newPage();
  await page.goto(new URL('#/', base).href);
  await expect(page).toHaveTitle('Medals by country | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();
  await page.goto(new URL('#/country/5', base).href);
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();
  console.log('OK Angular home and direct France route');
} finally {
  await browser.close();
}
