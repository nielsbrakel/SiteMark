import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
const tabTitle = () => screen.getByRole('figure').textContent ?? '';

describe('REQ-PLAY-002 the extension draws the playground marks in the mock browser', () => {
  it('draws the starting marks: a red PROD ribbon, a PROD banner and an outlined button', () => {
    render(createElement(Playground, { t: en.t }));
    expect(band()?.textContent).toBe('PROD');
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('red')),
    );
    expect(marks().querySelector('[role="note"]')?.textContent).toContain('PROD');
    const outline = marks().querySelector<HTMLElement>('.sm-outline');
    const button = screen.getByText('Delete customer');
    expect(outline).not.toBeNull();
    const [box, target] = [outline?.getBoundingClientRect(), button.getBoundingClientRect()];
    // The outline sits around the sample button.
    expect(box && box.left <= target.left && box.right >= target.right).toBe(true);
    expect(box && box.top <= target.top && box.bottom >= target.bottom).toBe(true);
  });

  it('follows the preset, the custom color and the mark text', () => {
    render(createElement(Playground, { t: en.t }));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(
      rgb(presetColor('blue')),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom color' }), {
      target: { value: '#00aa55' },
    });
    expect(band() && getComputedStyle(band() as HTMLElement).backgroundColor).toBe(rgb('#00aa55'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Mark text' }), {
      target: { value: 'STAGING' },
    });
    expect(band()?.textContent).toBe('STAGING');
  });

  it('adds and removes effects, and shows the title prefix in the mock tab', () => {
    render(createElement(Playground, { t: en.t }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Frame' }));
    expect(marks().querySelector('.sm-frame')).not.toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Banner' }));
    expect(marks().querySelector('[role="note"]')).toBeNull();
    expect(tabTitle()).not.toContain('PROD Customers');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Title prefix' }));
    expect(tabTitle()).toContain('PROD Customers');
  });

  it('draws nothing when every effect is off', () => {
    render(createElement(Playground, { t: en.t }));
    const page = within(screen.getByRole('group', { name: 'Effects on the page' }));
    fireEvent.click(page.getByRole('checkbox', { name: 'Ribbon' }));
    fireEvent.click(page.getByRole('checkbox', { name: 'Banner' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Outline' }));
    expect(marks().querySelectorAll('.sm-view')).toHaveLength(0);
  });
});
