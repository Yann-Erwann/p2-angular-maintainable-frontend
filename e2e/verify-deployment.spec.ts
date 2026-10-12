import { expect, test } from '@playwright/test';

function parseCsp(value: string): ReadonlyMap<string, readonly string[]> {
  const directives = new Map<string, readonly string[]>();
  for (const rawDirective of value.split(';')) {
    const parts = rawDirective.trim().split(/\s+/);
    if (parts.length === 1 && parts[0] === '') continue;
    const [name, ...sources] = parts;
    if (!name || directives.has(name))
      throw new Error(`Invalid or duplicate CSP directive: ${name}`);
    directives.set(name, sources);
  }
  return directives;
}

test('the deployed application serves HTML, data and working navigation', async ({
  baseURL,
  page,
  request,
}) => {
  test.setTimeout(120000);
  if (!baseURL) throw new Error('Playwright baseURL is required.');

  const base = new URL(baseURL.endsWith('/') ? baseURL : `${baseURL}/`);
  const htmlResponse = await request.get(base.href);
  expect(htmlResponse.ok()).toBe(true);
  expect(htmlResponse.headers()['content-type']).toContain('text/html');
  const html = await htmlResponse.text();
  expect(html).toContain('<app-root');
  expect(html).toContain('type="module"');
  if (process.env['PRODUCTION_SERVER_URL']) {
    const headers = htmlResponse.headers();
    const nonce = html.match(/\bngcspnonce=["']([^"']+)["']/i)?.[1];
    if (!nonce || !/^[A-Za-z0-9+/]{22}==$/.test(nonce)) {
      throw new Error('The deployed HTML must expose a generated CSP nonce for Angular styles.');
    }
    const csp = headers['content-security-policy'];
    if (!csp) throw new Error('The deployed application is missing Content-Security-Policy.');
    const directives = parseCsp(csp);
    const expectedDirectives = new Map<string, readonly string[]>([
      ['default-src', ["'self'"]],
      ['base-uri', ["'self'"]],
      ['object-src', ["'none'"]],
      ['frame-ancestors', ["'none'"]],
      ['script-src', ["'self'", `'nonce-${nonce}'`]],
      ['style-src', ["'self'", `'nonce-${nonce}'`]],
      ['img-src', ["'self'", 'data:']],
      ['connect-src', ["'self'"]],
      ['font-src', ["'self'", 'data:']],
      ['form-action', ["'self'"]],
    ]);
    expect(directives.size).toBe(expectedDirectives.size);
    for (const [name, sources] of expectedDirectives) {
      expect(directives.get(name), `Unexpected ${name} CSP directive`).toEqual(sources);
    }
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
  }

  const dataResponse = await request.get(new URL('assets/mock/olympic.json', base).href);
  expect(dataResponse.ok()).toBe(true);
  expect(dataResponse.headers()['content-type']).toContain('application/json');
  const countries = (await dataResponse.json()) as readonly {
    id: number;
    country: string;
    participations?: readonly unknown[];
  }[];
  const france = countries.find((country) => country.id === 5);
  expect(france?.country).toBe('France');
  expect(france?.participations?.length).toBeGreaterThan(0);

  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`JavaScript: ${error.message}`));
  page.on('console', (message) => {
    const isExpectedSpaFallback =
      message.type() === 'error' &&
      /^Failed to load resource: the server responded with a status of 404(?: \([^)]*\))?$/.test(
        message.text(),
      );
    if (message.type() === 'error' && !isExpectedSpaFallback) {
      failures.push(`Console: ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    const isSpaFallback = response.status() === 404 && response.request().isNavigationRequest();
    if (response.status() >= 400 && !isSpaFallback) {
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      failures.push(`Network: ${request.url()} (${request.failure()?.errorText})`);
    }
  });

  await page.goto(base.href);
  await expect(page).toHaveTitle('Medals by country | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('link', { name: 'France', exact: true }).click();
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();

  const directResponse = await page.goto(new URL('country/5', base).href);
  expect(directResponse?.status()).toBe(200);
  await page.reload();
  await expect(page).toHaveTitle('France | Olympic Games');
  await expect(page.locator('app-header dd')).toHaveText(['3', '113', '1238']);
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('link', { name: 'Home — TéléSport', exact: true }).click();
  await expect(page).toHaveTitle('Medals by country | Olympic Games');
  await expect(page.locator('canvas')).toBeVisible();

  expect(failures, failures.join('\n')).toEqual([]);
});
