import { defineConfig } from '@playwright/test';

const externalServer = process.env['PRODUCTION_SERVER_URL'];
const localServerUrl = 'http://127.0.0.1:4187/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalServer ?? localServerUrl,
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'],
    },
  },
  webServer: externalServer
    ? undefined
    : {
        command:
          'pnpm run build:e2e:local && pnpm exec serve -s dist/olympic-games-starter/local-e2e/browser --listen 4187',
        url: localServerUrl,
        reuseExistingServer: !process.env['CI'],
      },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/lighthouse.spec.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'lighthouse',
      testMatch: '**/lighthouse.spec.ts',
      retries: 0,
      use: { browserName: 'chromium' },
    },
  ],
});
