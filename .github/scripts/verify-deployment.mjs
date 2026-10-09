import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

if (!process.env.DEPLOYMENT_URL || !process.env.EXPECTED_REVISION) {
  throw new Error('DEPLOYMENT_URL and EXPECTED_REVISION are required.');
}
const base = new URL(
  process.env.DEPLOYMENT_URL.endsWith('/')
    ? process.env.DEPLOYMENT_URL
    : process.env.DEPLOYMENT_URL + '/',
);
const output = 'test-results/deployment';
await mkdir(output, { recursive: true });
const failures = [];
let browser;
let context;
let page;
async function getResource(route, type) {
  const response = await fetch(new URL(route, base), {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.url}`);
  if (!response.headers.get('content-type')?.includes(type)) {
    throw new Error(`Unexpected content type: ${response.url}`);
  }
  return response;
}
try {
  const html = await (await getResource('', 'text/html')).text();
  if (!html.includes('<app-root') || !html.includes('type="module"')) {
    throw new Error('Missing Angular bootstrap.');
  }
  const release = await (await getResource('release.json', 'application/json')).json();
  if (release.revision !== process.env.EXPECTED_REVISION) {
    throw new Error(`Wrong deployed revision: ${release.revision}`);
  }
  if (release.indexSha256 !== createHash('sha256').update(html).digest('hex')) {
    throw new Error('The HTML must match the validated release.');
  }
  const countries = await (
    await getResource('assets/mock/olympic.json', 'application/json')
  ).json();
  const france = Array.isArray(countries) && countries.find((country) => country.id === 5);
  if (france?.country !== 'France' || !france.participations?.length) {
    throw new Error('Missing France and its participations.');
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  context = await browser.newContext();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on('pageerror', (error) => failures.push(`JavaScript: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`Console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      failures.push(`Network: ${request.url()} (${request.failure()?.errorText})`);
    }
  });
  await page.goto(new URL('./', base).href);
  await expect(page).toHaveTitle('Medals by country | Olympic Games', { timeout: 15_000 });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: 'France', exact: true }).click();
  await expect(page).toHaveTitle('France | Olympic Games', { timeout: 15_000 });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.goto(new URL('country/5', base).href);
  await page.reload();
  await expect(page).toHaveTitle('France | Olympic Games', { timeout: 15_000 });
  await expect(page.locator('app-header dd')).toHaveText(['3', '113', '1238']);
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: 'Home — TéléSport', exact: true }).click();
  await expect(page).toHaveTitle('Medals by country | Olympic Games', { timeout: 15_000 });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('OK revision, HTML, data, home, France reload and return home');
} catch (error) {
  if (page)
    await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  await writeFile(
    `${output}/failure.json`,
    JSON.stringify({ error: String(error), failures }, null, 2),
  );
  throw error;
} finally {
  if (context) await context.tracing.stop({ path: `${output}/trace.zip` }).catch(() => {});
  if (browser) await browser.close();
}
