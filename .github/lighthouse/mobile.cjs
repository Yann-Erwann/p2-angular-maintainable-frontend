const { readFileSync } = require('node:fs');

const base = 'http://127.0.0.1:4187/p2-angular-maintainable-frontend/';
const countries = JSON.parse(
  readFileSync('dist/olympic-games-starter/browser/assets/mock/olympic.json', 'utf8'),
);
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node .github/scripts/serve-production.mjs',
      startServerReadyPattern: 'Lighthouse server ready',
      numberOfRuns: 3,
      url: [
        './',
        ...countries.map(({ id }) => `country/${id}`),
        'country/invalid',
        'country/999',
        'unknown/nested',
      ].map((route) => new URL(route, base).href),
      settings: {
        onlyCategories: categories,
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: Object.fromEntries(
        categories.map((category) => [
          `categories:${category}`,
          ['error', { minScore: 1, aggregationMethod: 'pessimistic' }],
        ]),
      ),
    },
  },
};
