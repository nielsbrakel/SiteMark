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
describe('REQ-PLAY-002 the extension draws the playground marks in the mock browser', () => {
  it('draws the starting mark: a red PROD ribbon in the top-right corner', () => {
    render(createElement(Playground, { t: en.t }));
    expect(band()?.textContent).toBe('PROD');
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('red')),
    );
    expect(marks().querySelectorAll('.sm-view')).toHaveLength(1);
  });

  it('follows the preset, the custom color and the mark text', () => {
    render(createElement(Playground, { t: en.t }));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('blue')),
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom color' }), {
      target: { value: '#00aa55' },
    });
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(rgb('#00aa55'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Mark text' }), {
      target: { value: 'STAGING' },
    });
    expect(band()?.textContent).toBe('STAGING');
  });

  it('moves the ribbon to the chosen corner', () => {
    render(createElement(Playground, { t: en.t }));
    const before = band()?.getBoundingClientRect();
    fireEvent.change(screen.getByRole('combobox', { name: 'Ribbon corner' }), {
      target: { value: 'bottom-left' },
    });
    const after = band()?.getBoundingClientRect();
    expect(before && after && after.left < before.left && after.top > before.top).toBe(true);
  });
});
