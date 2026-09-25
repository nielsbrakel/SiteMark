// Static server for the e2e fixture site (Playwright `webServer`). Every *.sitemark.test host
// resolves here through Chromium's --host-resolver-rules (tests/e2e/fixtures.ts).
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve('tests/e2e/site');
const port = Number(process.env.E2E_PORT ?? 4173);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
  if (!file.startsWith(root)) return void response.writeHead(403).end();
  try {
    const body = await readFile(file);
    const type = types[path.extname(file)] ?? 'application/octet-stream';
    response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(port, '127.0.0.1');
