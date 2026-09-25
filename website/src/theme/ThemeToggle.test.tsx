import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
const pressed = () =>
  within(screen.getByRole('group', { name: 'Theme' }))
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent);

describe('REQ-WEBUX-002 the theme toggle offers auto, light and dark', () => {
  it('shows three buttons and follows the OS by default', () => {
    render(<ThemeToggle t={en.t} />);
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Auto', 'Light', 'Dark']);
    expect(pressed()).toEqual(['Auto']);
  });

  it('starts from the theme the bootstrap already applied', () => {
    html().dataset.theme = 'dark';
    render(<ThemeToggle t={en.t} />);
    expect(pressed()).toEqual(['Dark']);
  });

  it('applies and remembers a forced theme', () => {
    render(<ThemeToggle t={en.t} />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Light' })));
    expect(html().dataset.theme).toBe('light');
    expect(storage.getItem(KEY)).toBe('light');
    expect(pressed()).toEqual(['Light']);
  });

  it('goes back to the OS theme with Auto', () => {
    html().dataset.theme = 'dark';
    storage.setItem(KEY, 'dark');
    render(<ThemeToggle t={en.t} />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Auto' })));
    expect(html().dataset.theme).toBeUndefined();
    expect(storage.getItem(KEY)).toBeNull();
    expect(pressed()).toEqual(['Auto']);
  });

  it('speaks the page language', () => {
    render(<ThemeToggle t={nl.t} />);
    const group = screen.getByRole('group', { name: 'Thema' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Automatisch', 'Licht', 'Donker']);
  });

  it('is hidden until the bootstrap marks <html data-js> (no JavaScript: the OS decides)', () => {
    const file = path.resolve('website/src/theme/ThemeToggle.module.css');
    const css = existsSync(file) ? readFileSync(file, 'utf8') : '';
    expect(css).toMatch(
      /:global\(:root:not\(\[data-js\]\)\) \.toggle\s*\{[^}]*display:\s*none;[^}]*\}/,
    );
    render(<ThemeToggle t={en.t} />);
    expect(screen.getByRole('group', { name: 'Theme' }).className).toMatch(/toggle/);
  });
});

describe('REQ-WEB-004 the toggle stores nothing but the theme choice', () => {
  it('uses only the sitemark-website:theme key', () => {
    render(<ThemeToggle t={en.t} />);
    for (const name of ['Dark', 'Light', 'Dark']) {
      act(() => fireEvent.click(screen.getByRole('button', { name })));
    }
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
    expect(keys).toEqual([KEY]);
    expect(storage.getItem(KEY)).toBe('dark');
  });
});
