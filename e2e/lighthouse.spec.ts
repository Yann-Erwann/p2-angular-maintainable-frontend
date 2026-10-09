import { chromium, expect, test } from '@playwright/test';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { readFileSync } from 'node:fs';

const countries = JSON.parse(
  readFileSync('dist/olympic-games-starter/browser/assets/mock/olympic.json', 'utf8'),
) as readonly { id: number }[];
const routes = [
  { name: 'home', path: './' },
  ...countries.map(({ id }) => ({ name: `country-${id}`, path: `country/${id}` })),
];
const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

for (const route of routes) {
  for (const profile of ['mobile', 'desktop'] as const) {
    for (let run = 1; run <= 3; run++) {
      test(`${route.name} ${profile} run ${run}: Lighthouse 100`, async ({
        baseURL,
        request,
      }, testInfo) => {
        test.setTimeout(120_000);
        const url = new URL(route.path, baseURL).href;
        const response = await request.get(url);
        expect(response.status(), `Audited route must return HTTP 200: ${url}`).toBe(200);
        const browser = await chromium.launch({
          executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'],
          args: ['--remote-debugging-port=9225'],
        });
        try {
          const result = await lighthouse(
            url,
            {
              port: 9225,
              onlyCategories: [...categories],
              output: ['json', 'html'],
              logLevel: 'error',
            },
            profile === 'desktop' ? desktopConfig : undefined,
          );
          if (!result) throw new Error(`Lighthouse returned no report for ${url}`);
          await testInfo.attach('lighthouse.json', {
            body: JSON.stringify(result.lhr, null, 2),
            contentType: 'application/json',
          });
          const reports = result.report;
          if (Array.isArray(reports) && reports[1]) {
            await testInfo.attach('lighthouse.html', {
              body: reports[1],
              contentType: 'text/html',
            });
          }
          expect(result.lhr.runtimeError, 'Lighthouse audit must complete').toBeUndefined();
          for (const category of categories) {
            expect
              .soft(
                result.lhr.categories[category]?.score,
                `${route.name} ${profile} run ${run}: ${category} must score 100`,
              )
              .toBe(1);
          }
        } finally {
          await browser.close();
        }
      });
    }
  }
}
