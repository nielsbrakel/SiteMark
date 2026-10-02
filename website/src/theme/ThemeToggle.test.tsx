import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { ThemeToggle } from './ThemeToggle';

const KEY = 'sitemark-website:theme';
// The test inspects what the toggle stored (only bootstrap.ts may use localStorage in website code).
const storage = window.localStorage;
let en: WebsiteTranslator;
let nl: WebsiteTranslator;

beforeAll(async () => {
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
  nl = createWebsiteTranslator('nl', await loadCatalogs('nl'));
});

beforeEach(() => {
  storage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(cleanup);

const html = () => document.documentElement;
const selected = () =>
  screen
    .getAllByRole('radio')
    .find((radio) => radio.getAttribute('aria-checked') === 'true')
    ?.getAttribute('aria-label');
const choose = (name: string) => act(() => fireEvent.click(screen.getByRole('radio', { name })));

describe('REQ-WEBUX-002 the theme toggle offers system, light and dark as icons', () => {
  it('shows three icon-only options, named in the page language, and follows the OS by default', () => {
    render(<ThemeToggle t={nl.t} />);
    const names = screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'));
    expect(names).toEqual(['Systeem', 'Licht', 'Donker']);
    expect(screen.getByRole('radiogroup', { name: 'Thema' })).toBeTruthy();
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['', '', '']);
    expect(selected()).toBe('Systeem');
  });

  it('starts from the theme the bootstrap already applied', () => {
    html().dataset.theme = 'dark';
    render(<ThemeToggle t={en.t} />);
    expect(selected()).toBe('Dark');
  });

  it('applies and remembers a forced theme, and forgets it again with System', () => {
    render(<ThemeToggle t={en.t} />);
    choose('Light');
    expect(html().dataset.theme).toBe('light');
    expect(storage.getItem(KEY)).toBe('light');
    expect(selected()).toBe('Light');
    choose('System');
    expect(html().dataset.theme).toBeUndefined();
    expect(storage.getItem(KEY)).toBeNull();
    expect(selected()).toBe('System');
  });

  it('is hidden until the bootstrap marks <html data-js> (no JavaScript: the OS decides)', () => {
    const file = path.resolve('website/src/theme/ThemeToggle.module.css');
    const css = existsSync(file) ? readFileSync(file, 'utf8') : '';
    expect(css).toMatch(
      /:global\(:root:not\(\[data-js\]\)\) \.toggle\s*\{[^}]*display:\s*none;[^}]*\}/,
    );
    render(<ThemeToggle t={en.t} />);
    expect(screen.getByRole('radiogroup', { name: 'Theme' }).parentElement?.className).toMatch(
      /toggle/,
    );
  });
});

describe('REQ-WEB-004 the toggle stores nothing but the theme choice', () => {
  it('uses only the sitemark-website:theme key', () => {
    render(<ThemeToggle t={en.t} />);
    for (const name of ['Dark', 'Light', 'Dark']) choose(name);
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
    expect(keys).toEqual([KEY]);
    expect(storage.getItem(KEY)).toBe('dark');
  });
});
