import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { presetColor } from '@/core/model/presets';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { Playground } from './Playground';

// The playground in real Chromium: the extension's compose + marker views draw in the shared mock
// browser's shadow root (open in tests, D-226).

let en: WebsiteTranslator;

beforeAll(async () => {
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
});

afterEach(() => cleanup());

/** The mark views inside the mock browser's shadow root. */
function marks(): ShadowRoot {
  const host = document.querySelector('[data-marker-host]');
  expect(host?.shadowRoot, 'the preview has a shadow root').toBeTruthy();
  return host?.shadowRoot as ShadowRoot;
}

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

const band = () => marks().querySelector<HTMLElement>('.sm-ribbon__band');
const flip = (name: string) =>
  fireEvent.click(screen.getAllByRole('switch', { name })[0] as HTMLElement);
const shown = () =>
  document.querySelector('[data-marker-host]')?.shadowRoot?.querySelector('.sm-view');

describe('REQ-PLAY-002 the extension draws the playground marks in the mock browser', () => {
  it('draws the starting mark: a red PROD ribbon in the top-right corner', () => {
    render(createElement(Playground, { t: en.t }));
    expect(band()?.textContent).toBe('PROD');
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('red')),
    );
    // The ribbon and the outline on the sample button.
    expect(marks().querySelectorAll('.sm-view')).toHaveLength(2);
  });

  it('follows the color and the ribbon text', () => {
    render(createElement(Playground, { t: en.t }));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('blue')),
    );
    const text = screen.getByRole('textbox', { name: 'Ribbon text' });
    fireEvent.change(text, { target: { value: 'STAGING' } });
    fireEvent.blur(text);
    expect(band()?.textContent).toBe('STAGING');
  });

  it('draws every page effect the mark editor offers', () => {
    render(createElement(Playground, { t: en.t }));
    for (const name of ['Banner', 'Frame', 'Tint', 'Stripes', 'Watermark']) flip(name);
    for (const selector of ['.sm-ribbon', '.sm-banner', '.sm-frame', '.sm-tint', '.sm-stripes']) {
      expect(marks().querySelector(selector), selector).not.toBeNull();
    }
    expect(marks().querySelector('.sm-watermark__plane')).not.toBeNull();
  });

  it('outlines the sample button until its mark is off, and drops the page ribbon with its switch', () => {
    render(createElement(Playground, { t: en.t }));
    const outline = marks().querySelector('.sm-outline')?.getBoundingClientRect();
    const button = screen.getByText('Delete customer').getBoundingClientRect();
    expect(button.width).toBeGreaterThan(0);
    expect(outline?.left).toBeLessThanOrEqual(button.left);
    expect(outline?.top).toBeLessThanOrEqual(button.top);
    expect(outline?.right).toBeGreaterThanOrEqual(button.right);
    expect(outline?.bottom).toBeGreaterThanOrEqual(button.bottom);
    flip('Also mark the Delete customer button');
    expect(marks().querySelector('.sm-outline')).toBeNull();
    flip('Frame');
    fireEvent.click(screen.getAllByRole('switch', { name: 'Ribbon' })[0] as HTMLElement);
    expect(band()).toBeNull();
    expect(marks().querySelector('.sm-frame')).not.toBeNull();
  });
});

describe('REQ-PLAY-002 the SiteMark switch shows the page with and without the marks', () => {
  it('removes every mark while it is off and draws them again when it is on', () => {
    render(createElement(Playground, { t: en.t }));
    const toggle = screen.queryByRole('switch', { name: 'SiteMark on this page' });
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle as HTMLElement);
    expect(shown() ?? null).toBeNull();
    fireEvent.click(toggle as HTMLElement);
    expect(band()?.textContent).toBe('PROD');
  });
});
