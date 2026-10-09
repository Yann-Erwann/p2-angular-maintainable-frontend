import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [baseline, current] = process.argv.slice(2).filter((argument) => argument !== '--');
if (!baseline || !current)
  throw new Error('Usage: node scripts/compare-performance.mjs <baseline> <current>');
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
async function measure(folder, name) {
  const reports = await Promise.all(
    [1, 2, 3].map(async (run) =>
      JSON.parse(await readFile(resolve(folder, `${name}-${run}.report.json`), 'utf8')),
    ),
  );
  return {
    lcpMs: median(reports.map((report) => report.audits['largest-contentful-paint'].numericValue)),
    cls: median(reports.map((report) => report.audits['cumulative-layout-shift'].numericValue)),
    javascriptBytes: median(
      reports.map((report) =>
        report.audits['network-requests'].details.items
          .filter((item) => item.resourceType === 'Script')
          .reduce((sum, item) => sum + item.transferSize, 0),
      ),
    ),
    transferredBytes: median(
      reports.map((report) => report.audits['total-byte-weight'].numericValue),
    ),
  };
}
const summary = {};
let failed = false;
for (const name of ['home', 'france']) {
  const before = await measure(baseline, name);
  const after = await measure(current, name);
  const lcpChange = after.lcpMs / before.lcpMs - 1;
  const javascriptChange = after.javascriptBytes / before.javascriptBytes - 1;
  summary[name] = { before, after, lcpChange, javascriptChange };
  if (lcpChange > 0.1 || javascriptChange > 0.05) failed = true;
}
await writeFile(resolve(current, 'comparison.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (failed) process.exitCode = 1;
