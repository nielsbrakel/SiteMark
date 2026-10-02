import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import type { RenderedPage } from '../entry-server';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { HeroPlayground } from './HeroPlayground';
import { Playground } from './Playground';

let en: WebsiteTranslator;
let pages: RenderedPage[];

beforeAll(async () => {
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
  pages = await pagesForDom();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

const effects = () => screen.getAllByRole('group', { name: 'Effects' });
const switchNames = (group: HTMLElement) =>
  within(group)
    .getAllByRole('switch')
    .map((control) => control.closest('span')?.querySelector('label')?.textContent);
const status = () => screen.getByText(/^The page shows/).textContent;

describe('REQ-PLAY-001 the playground is the options page’s mark form next to a mock browser', () => {
  it('offers the same colors, text color and page effects as the mark editor', () => {
    render(<Playground t={en.t} />);
    const swatches = within(screen.getByRole('radiogroup', { name: 'Color' }));
    expect(swatches.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual(
      ['Red', 'Amber', 'Blue', 'Slate'],
    );
    expect(screen.getByRole('radio', { name: 'Red' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Text color' })).toBeTruthy();
    expect(switchNames(effects()[0] as HTMLElement)).toEqual([
      'Ribbon',
      'Banner',
      'Frame',
      'Tint',
      'Stripes',
      'Watermark',
      'Title prefix',
      'Favicon',
    ]);
  });

  it('starts with the ribbon, which stays on as the last effect, and shows settings for what is on', () => {
    render(<Playground t={en.t} />);
    const ribbon = () =>
      within(effects()[0] as HTMLElement).getByRole('switch', { name: 'Ribbon' });
    expect(ribbon()).toHaveProperty('disabled', true);
    expect(screen.getByRole('textbox', { name: 'Ribbon text' })).toHaveProperty('value', 'PROD');
    expect(screen.queryByRole('slider', { name: 'Frame width' })).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Frame' }));
    expect(screen.getByRole('slider', { name: 'Frame width' })).toBeTruthy();
    expect(ribbon()).toHaveProperty('disabled', false);
  });

  it('marks the sample button from the start, with the effects an element can have', () => {
    render(<Playground t={en.t} />);
    expect(effects()).toHaveLength(2);
    expect(switchNames(effects()[1] as HTMLElement)).toEqual([
      'Ribbon',
      'Outline',
      'Pulse',
      'Tint',
      'Stripes',
    ]);
    fireEvent.click(screen.getByRole('switch', { name: 'Also mark the Delete customer button' }));
    expect(effects()).toHaveLength(1);
  });

  it('shows a mock browser: tab title, sample address and a sample web shop', () => {
    render(<Playground t={en.t} />);
    const preview = screen.getByRole('figure', { name: 'Preview of a marked page' });
    expect(preview.textContent).toContain('Leaf & Lamp');
    expect(preview.textContent).toContain('https://shop.example.com/');
  });

  it('has its own page at /playground/ and /nl/playground/, with the playground as an island', () => {
    for (const [file, heading] of [
      ['playground/index.html', 'Playground'],
      ['nl/playground/index.html', 'Uitproberen'],
    ] as const) {
      showPage(pages, file);
      expect(screen.queryByRole('heading', { level: 1 })?.textContent).toBe(heading);
      const island = document.querySelector<HTMLElement>('[data-island="playground"]');
      expect(island?.querySelector('figure')).not.toBeNull();
    }
  });
});

describe('REQ-PLAY-006 input shows the options page’s checks and messages', () => {
  it('refuses a custom color that is not a hex color', async () => {
    render(<Playground t={en.t} />);
    const field = screen.getByRole('textbox', { name: 'Custom color' });
    fireEvent.change(field, { target: { value: 'blue' } });
    fireEvent.blur(field);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a color like #1f6feb.')).toBeTruthy();
    fireEvent.change(field, { target: { value: '#00ff88' } });
    fireEvent.blur(field);
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBeNull());
  });

  it('refuses an empty ribbon text', () => {
    render(<Playground t={en.t} />);
    const field = screen.getByRole('textbox', { name: 'Ribbon text' });
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.blur(field);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText("Enter a text, so the mark doesn't rely on color alone.")).toBeTruthy();
  });
});

describe('REQ-PLAY-005 the playground is accessible', () => {
  it('has no axe violations with every effect on and a field showing an error', async () => {
    const { container } = render(<Playground t={en.t} />);
    for (const name of ['Banner', 'Frame', 'Tint', 'Stripes', 'Watermark', 'Title prefix']) {
      fireEvent.click(screen.getAllByRole('switch', { name })[0] as HTMLElement);
    }
    fireEvent.click(screen.getByRole('switch', { name: 'Outline' }));
    const hex = screen.getByRole('textbox', { name: 'Custom color' });
    fireEvent.change(hex, { target: { value: 'nope' } });
    fireEvent.blur(hex);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('tells assistive technology what the preview shows, in words', () => {
    render(<Playground t={en.t} />);
    expect(status()).toBe('The page shows ribbon in red. The Delete customer button has outline.');
    fireEvent.click(screen.getByRole('radio', { name: 'Slate' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Frame' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Also mark the Delete customer button' }));
    expect(status()).toBe('The page shows ribbon, frame in slate.');
  });

  it('describes the hero preview too, and names its presets', async () => {
    const { container } = render(<HeroPlayground t={en.t} />);
    expect(status()).toContain('in red');
    fireEvent.click(screen.getByRole('radio', { name: 'Amber' }));
    expect(status()).toContain('in amber');
    expect(await axeViolations(container)).toEqual([]);
  });
});
