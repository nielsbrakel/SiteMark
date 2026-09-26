import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Assertions on the built website (`pnpm web:test:build` builds it first).
const dist = path.resolve('website/dist/client');
const read = (file: string) =>
  existsSync(path.join(dist, file)) ? readFileSync(path.join(dist, file), 'utf8') : '';

/** Every route that has a page so far (later pages add rows here). */
const pages = [
  {
    file: 'index.html',
    locale: 'en',
    route: 'home',
    h1: 'Never confuse production with test again',
  },
  {
    file: 'nl/index.html',
    locale: 'nl',
    route: 'home',
    h1: 'Verwar productie nooit meer met test',
  },
  { file: 'privacy/index.html', locale: 'en', route: 'privacy', h1: 'Privacy policy' },
  { file: 'nl/privacy/index.html', locale: 'nl', route: 'privacy', h1: 'Privacyverklaring' },
];

describe('REQ-WEB-002 every route is prerendered to one static HTML file', () => {
  it.each(pages)('$file is a complete document for $route ($locale)', ({ file, locale, route }) => {
    const html = read(file);
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain(`<html lang="${locale}" data-route="${route}" data-locale="${locale}">`);
  });

  it.each(pages)('$file carries its content, so it reads without JavaScript', ({ file, h1 }) => {
    const root = read(file).match(/<div id="root">([\s\S]*)<\/div>/)?.[1] ?? '';
    expect(root).toMatch(new RegExp(`<h1( [^>]*)?>${h1}</h1>`));
    expect(root).not.toContain('<script');
  });

  it.each(pages)('$file loads the hashed client module from the base path', ({ file }) => {
    // Scripts with a src; the inline bootstrap and JSON-LD are checked in output.test.ts.
    const scripts = [...read(file).matchAll(/<script ([^>]*\bsrc=[^>]*)>/g)].map((m) => m[1] ?? '');
    expect(scripts).toHaveLength(1);
    const src = scripts[0]?.match(/^type="module" src="\/SiteMark\/(assets\/[\w-]+\.js)"$/)?.[1];
    expect(src, scripts[0]).toBeDefined();
    expect(existsSync(path.join(dist, src ?? 'missing'))).toBe(true);
  });

  it.each(pages)('$file links its stylesheets from the base path', ({ file }) => {
    const styles = [...read(file).matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
      (m) => m[1] ?? '',
    );
    expect(styles.length).toBeGreaterThan(0);
    for (const href of styles) {
      expect(href).toMatch(/^\/SiteMark\/assets\/[\w-]+\.css$/);
      expect(existsSync(path.join(dist, href.replace('/SiteMark/', '')))).toBe(true);
    }
  });

  it.each(pages)('$file is styled: its stylesheets define every class it uses', ({ file }) => {
    // Page components never run in the browser (only islands do), yet their CSS must ship.
    const html = read(file);
    const css = [...html.matchAll(/<link rel="stylesheet" href="\/SiteMark\/([^"]+)"/g)]
      .map((m) => read(m[1] ?? ''))
      .join('\n');
    const classes = [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => (m[1] ?? '').split(' '));
    expect(classes.length).toBeGreaterThan(0);
    for (const name of new Set(classes)) expect(css, `${file}: .${name}`).toContain(`.${name}`);
  });

  it('ships no build manifest or server bundle', () => {
    expect(existsSync(path.join(dist, '.vite'))).toBe(false);
    expect(read('index.html')).not.toBe('');
  });
});
