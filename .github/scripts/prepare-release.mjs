import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const output = 'dist/olympic-games-starter';
const html = await readFile(`${output}/browser/index.html`, 'utf8');
const countries = JSON.parse(await readFile(`${output}/browser/assets/mock/olympic.json`, 'utf8'));
for (const country of countries) {
  if (!Number.isSafeInteger(country.id) || country.id <= 0)
    throw new Error('Invalid country route.');
  const directory = `${output}/browser/country/${country.id}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html);
}
await writeFile(`${output}/browser/404.html`, html);
await writeFile(
  `${output}/browser/release.json`,
  JSON.stringify({
    revision: process.env.RELEASE_REVISION,
    indexSha256: createHash('sha256').update(html).digest('hex'),
  }) + '\n',
);
