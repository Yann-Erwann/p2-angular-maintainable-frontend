import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2).filter((argument) => argument !== '--');
const base = args[0] ?? 'http://127.0.0.1:4187/p2-angular-maintainable-frontend/';
const output = resolve(args[1] ?? 'validation-artifacts/performance');
await mkdir(output, { recursive: true });
// Lighthouse connects to an explicit Linux/browser process, including under WSL.
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ['--remote-debugging-port=9225'],
});
try {
  for (const [name, route] of [
    ['home', '#/'],
    ['france', '#/country/5'],
  ]) {
    for (let run = 1; run <= 3; run++) {
      const result = await lighthouse(new URL(route, base).href, {
        port: 9225,
        onlyCategories: ['performance'],
        output: 'json',
        logLevel: 'error',
      });
      if (!result || result.lhr.runtimeError) throw new Error(`Lighthouse failed for ${name}`);
      await writeFile(
        resolve(output, `${name}-${run}.report.json`),
        JSON.stringify(result.lhr, null, 2),
      );
      console.log(`Measured ${name} (${run}/3)`);
    }
  }
} finally {
  await browser.close();
}
