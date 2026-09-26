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

// Strict page CSP with Trusted Types, sent as a real header (REQ-SEC-007). A <meta> CSP can't
// express everything and applies too late.
const strictCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
].join('; ');
const pageHeaders = { '/csp.html': { 'content-security-policy': strictCsp } };

/** The SPA fixture owns /spa and everything below it, so pushState URLs survive a reload. */
const resolvePath = (pathname) =>
  pathname === '/spa' || pathname.startsWith('/spa/') ? '/spa.html' : pathname;

createServer(async (request, response) => {
  const pathname = resolvePath(new URL(request.url ?? '/', 'http://localhost').pathname);
  const file = path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
  if (!file.startsWith(root)) return void response.writeHead(403).end();
  try {
    const body = await readFile(file);
    const type = types[path.extname(file)] ?? 'application/octet-stream';
    response
      .writeHead(200, {
        'content-type': type,
        'cache-control': 'no-store',
        ...pageHeaders[pathname],
      })
      .end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(port, '127.0.0.1');
