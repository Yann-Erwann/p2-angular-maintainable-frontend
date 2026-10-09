import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  process.execPath,
  [
    resolve(root, 'node_modules/@angular/cli/bin/ng.js'),
    'build',
    ...process.argv.slice(2),
    '--stats-json',
  ],
  { cwd: root, stdio: 'inherit' },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const config = JSON.parse(await readFile(resolve(root, 'angular.json'), 'utf8'));
const outputPath = config.projects['olympic-games-starter'].architect.build.options.outputPath;
const output = resolve(root, typeof outputPath === 'string' ? outputPath : outputPath.base);
const stats = JSON.parse(await readFile(resolve(output, 'stats.json'), 'utf8'));
const chart = Object.entries(stats.outputs).find(
  ([, value]) => value.entryPoint === 'src/app/olympics/chart/chart.component.ts',
);
if (!chart) throw new Error('The build did not emit the Olympic chart module.');

const indexPath = resolve(
  output,
  typeof outputPath === 'string' ? 'browser' : (outputPath.browser ?? 'browser'),
  'index.html',
);
const html = await readFile(indexPath, 'utf8');
if (!html.includes('</head>')) throw new Error('The build did not emit an HTML head.');
const href = chart[0];
await writeFile(
  indexPath,
  html.replace('</head>', `<link rel="modulepreload" href="${href}"></head>`),
);
console.log(`Preloaded Olympic chart module: ${href}`);
