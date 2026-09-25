import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { allTags, cspOf, metaContent, scriptsOf, type Tag, tags } from '../html';

// Assertions on everything in the built website (`pnpm web:test:build` builds it first).
const dist = path.resolve('website/dist/client');
const BASE = '/SiteMark/';
const WEBSITE = `https://nielsbrakel.github.io${BASE}`;
const KB = 1024;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(path.join(dir, entry.name))
      : [path.relative(dist, path.join(dir, entry.name))],
  );
}

const files = existsSync(dist) ? walk(dist).map((file) => file.split(path.sep).join('/')) : [];
const pages = files.filter((file) => file.endsWith('.html'));
const read = (file: string) => readFileSync(path.join(dist, file), 'utf8');
const gzipped = (file: string) => gzipSync(readFileSync(path.join(dist, file))).length;

/** Where links may leave the website (docs/website/plan.md §6). */
const EXTERNAL_LINKS = [
  /^https:\/\/github\.com\/nielsbrakel\/SiteMark(?:[/?#][^\s]*)?$/,
  /^https:\/\/chromewebstore\.google\.com\//,
  /^https:\/\/microsoftedge\.microsoft\.com\/addons\//,
  /^https:\/\/addons\.mozilla\.org\//,
  /^https:\/\/apps\.apple\.com\//,
  /^https:\/\/docs\.github\.com\/[a-z-]+\/site-policy\/privacy-policies\/github-general-privacy-statement(?:#[\w-]*)?$/,
];

const URL_ATTRIBUTES = ['href', 'src', 'poster', 'action', 'formaction', 'data'];

/** Every URL in an attribute (srcset lists split), plus Open Graph / Twitter URLs. */
function urlsOf(tag: Tag): string[] {
  const { attributes } = tag;
  const direct = URL_ATTRIBUTES.flatMap((name) => attributes[name] ?? []);
  const srcset = (attributes.srcset ?? '')
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0] ?? '')
    .filter(Boolean);
  const meta =
    tag.name === 'meta' && /(:url|:image)$/.test(attributes.property ?? attributes.name ?? '');
  return [...direct, ...srcset, ...(meta ? [attributes.content ?? ''] : [])];
}

/** Tags whose URL the browser fetches while loading the page. */
function resourcesOf(html: string): string[] {
  const loaded = allTags(html).filter(
    (tag) =>
      ['script', 'img', 'source', 'video', 'audio', 'track', 'iframe', 'embed', 'object'].includes(
        tag.name,
      ) ||
      (tag.name === 'link' && !['canonical', 'alternate'].includes(tag.attributes.rel ?? '')),
  );
  return loaded.flatMap(urlsOf);
}

/** The built file a website URL points to, or undefined when it isn't one. */
function fileFor(url: string): string | undefined {
  const pathname = url.replace(/^https:\/\/nielsbrakel\.github\.io/, '').replace(/[?#].*$/, '');
  if (!pathname.startsWith(BASE)) return undefined;
  const file = pathname.slice(BASE.length);
  return file === '' || file.endsWith('/') ? `${file}index.html` : file;
}

describe('REQ-WEB-001 every internal URL carries the base path and resolves', () => {
  it('built the website', () => {
    expect(pages).toContain('index.html');
    expect(pages).toContain('nl/index.html');
  });

  it.each(pages)('%s: internal URLs start with /SiteMark/', (file) => {
    for (const url of allTags(read(file)).flatMap(urlsOf)) {
      if (url.startsWith('https://') || url.startsWith('#')) continue;
      expect(url, file).toMatch(/^\/SiteMark\//);
    }
  });

  it.each(pages)('%s: every URL on the website points to a built file', (file) => {
    for (const url of allTags(read(file)).flatMap(urlsOf)) {
      const target = fileFor(url);
      if (target === undefined) continue;
      expect(files, `${file} → ${url}`).toContain(target);
    }
  });
});

describe('REQ-WEB-003 the website loads nothing from anywhere else', () => {
  it.each(pages)('%s: every resource comes from /SiteMark/ (no data: or remote URLs)', (file) => {
    const resources = resourcesOf(read(file));
    expect(resources.length, file).toBeGreaterThan(0);
    for (const url of resources) expect(url, file).toMatch(/^\/SiteMark\/[^/]/);
    expect(tags(read(file), 'iframe'), file).toEqual([]);
  });

  it.each(pages)('%s: links leave only to GitHub, the stores and GitHub privacy', (file) => {
    const external = tags(read(file), 'a')
      .map((a) => a.href ?? '')
      .filter((href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//'));
    for (const href of external) {
      expect(
        EXTERNAL_LINKS.some((pattern) => pattern.test(href)),
        `${file} → ${href}`,
      ).toBe(true);
    }
  });

  it.each(pages)('%s: canonical, alternate and preview URLs stay on the website', (file) => {
    const html = read(file);
    const absolute = [
      ...tags(html, 'link')
        .filter((link) => ['canonical', 'alternate'].includes(link.rel ?? ''))
        .map((link) => link.href ?? ''),
      metaContent(html, 'og:url') ?? WEBSITE,
      metaContent(html, 'og:image') ?? WEBSITE,
      metaContent(html, 'twitter:image') ?? WEBSITE,
    ];
    for (const url of absolute) expect(url.startsWith(WEBSITE), `${file} → ${url}`).toBe(true);
  });

  it('stylesheets load nothing from elsewhere', () => {
    const css = files.filter((file) => file.endsWith('.css'));
    expect(css.length).toBeGreaterThan(0);
    for (const file of css) {
      const text = read(file);
      expect(text, file).not.toMatch(/@import/);
      for (const [, url = ''] of text.matchAll(/url\(\s*['"]?([^'")]+)/g)) {
        expect(url, file).toMatch(/^(\/SiteMark\/|#)/);
      }
    }
  });
});

describe('REQ-WEB-005 only the hashed bootstrap and JSON-LD are inline, and no inline styles', () => {
  it.each(pages)('%s: the CSP pins exactly the one inline script', (file) => {
    const html = read(file);
    const policy = cspOf(html) ?? '';
    const directives = Object.fromEntries(
      policy.split(';').map((directive) => {
        const [name = '', ...values] = directive.trim().split(/\s+/);
        return [name, values];
      }),
    );
    const inline = scriptsOf(html).filter(({ attributes }) => !attributes.src);
    const code = inline.filter(({ attributes }) => attributes.type !== 'application/ld+json');
    expect(code, file).toHaveLength(1);
    const hash = `'sha256-${createHash('sha256')
      .update(code[0]?.text ?? '')
      .digest('base64')}'`;
    expect(directives, file).toEqual({
      'default-src': ["'none'"],
      'script-src': ["'self'", hash],
      'style-src': ["'self'"],
      'img-src': ["'self'"],
      'connect-src': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
    });
    for (const { text } of inline.filter((script) => !code.includes(script))) {
      expect(() => JSON.parse(text), file).not.toThrow();
    }
  });

  it.each(pages)('%s: the CSP comes before every script and stylesheet', (file) => {
    const head = allTags(read(file));
    const at = head.findIndex(
      (tag) => tag.name === 'meta' && tag.attributes['http-equiv'] === 'Content-Security-Policy',
    );
    expect(at, file).toBeGreaterThan(0);
    // React puts charset, viewport and its own image preloads first; those are same-origin
    // images, which img-src 'self' allows anyway (the resource test above checks their URLs).
    for (const tag of head.slice(0, at)) {
      const early =
        (tag.name === 'meta' &&
          ('charset' in tag.attributes || tag.attributes.name === 'viewport')) ||
        (tag.name === 'link' &&
          tag.attributes.rel === 'preload' &&
          tag.attributes.as === 'image') ||
        ['html', 'head'].includes(tag.name);
      expect(early, `${file} <${tag.name}> before the CSP`).toBe(true);
    }
  });

  it.each(pages)('%s: sends only its origin as the referrer', (file) => {
    expect(metaContent(read(file), 'referrer')).toBe('strict-origin-when-cross-origin');
  });

  it.each(pages)('%s: has no style attributes, <style> elements or on* handlers', (file) => {
    for (const tag of allTags(read(file))) {
      expect(tag.name, file).not.toBe('style');
      for (const name of Object.keys(tag.attributes)) {
        expect(name, `${file} <${tag.name}>`).not.toBe('style');
        expect(name, `${file} <${tag.name}>`).not.toMatch(/^on/);
      }
    }
  });
});

describe('REQ-WEB-006 the output has no HTML sinks or dynamic code', () => {
  it.each(pages)('%s: no innerHTML in the HTML', (file) => {
    expect(read(file)).not.toMatch(/innerHTML|dangerouslySetInnerHTML/);
  });

  it('no eval or new Function in the built JavaScript', () => {
    const scripts = files.filter((file) => file.endsWith('.js'));
    expect(scripts.length).toBeGreaterThan(0);
    for (const file of scripts) expect(read(file), file).not.toMatch(/\beval\(|new Function\b/);
  });
});

/** The page's module scripts and every chunk they import, statically or on demand. */
function scriptGraph(html: string): string[] {
  const queue = scriptsOf(html)
    .map(({ attributes }) => fileFor(attributes.src ?? ''))
    .filter((file): file is string => file !== undefined);
  const seen = new Set<string>();
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (seen.has(file) || !files.includes(file)) continue;
    seen.add(file);
    for (const [, spec = ''] of read(file).matchAll(
      /(?:import|from)\s*\(?\s*["'](\.{1,2}\/[^"']+\.js)["']/g,
    )) {
      queue.push(path.posix.join(path.posix.dirname(file), spec));
    }
  }
  return [...seen];
}

describe('REQ-WEB-007 every page stays within its budgets', () => {
  it.each(pages)('%s: ≤ 80 KB gzipped JavaScript (React included)', (file) => {
    const scripts = scriptGraph(read(file));
    expect(scripts.length, file).toBeGreaterThan(0);
    const total = scripts.reduce((sum, script) => sum + gzipped(script), 0);
    expect(total, `${file}: ${scripts.join(', ')}`).toBeLessThanOrEqual(80 * KB);
  });

  it.each(pages)('%s: ≤ 30 KB gzipped HTML + CSS', (file) => {
    const css = tags(read(file), 'link')
      .filter((link) => link.rel === 'stylesheet')
      .map((link) => fileFor(link.href ?? ''))
      .filter((part): part is string => part !== undefined && files.includes(part));
    const total = [file, ...css].reduce((sum, part) => sum + gzipped(part), 0);
    expect(total, file).toBeLessThanOrEqual(30 * KB);
  });

  it('keeps every raster image ≤ 200 KB', () => {
    const images = files.filter((file) => /\.(png|jpe?g|webp|avif|gif)$/i.test(file));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(statSync(path.join(dist, image)).size, image).toBeLessThanOrEqual(200 * KB);
    }
  });

  it.each(pages)('%s: gives every <img> a width and a height', (file) => {
    for (const img of tags(read(file), 'img')) {
      expect(Number(img.width), `${file} ${img.src}`).toBeGreaterThan(0);
      expect(Number(img.height), `${file} ${img.src}`).toBeGreaterThan(0);
    }
  });
});
