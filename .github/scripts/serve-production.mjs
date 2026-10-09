import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist/olympic-games-starter/browser');
const prefix = '/p2-angular-maintainable-frontend/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end();
      return;
    }
    let file = resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      if (!(await stat(file)).isFile()) throw new Error('Not a file.');
    } catch {
      if (extname(file)) {
        response.writeHead(404).end();
        return;
      }
      file = resolve(root, '404.html');
      status = 404;
    }
    response.writeHead(status, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(4187, '127.0.0.1', () => console.log('Lighthouse server ready'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
