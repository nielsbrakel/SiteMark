import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

const names = (elements: HTMLElement[]) => elements.map((element) => element.textContent?.trim());
const group = (name: string) => screen.getByRole('group', { name });
const labelsIn = (name: string, role: 'radio' | 'checkbox') =>
  within(group(name))
    .getAllByRole(role)
    .map((control) => control.closest('label')?.textContent?.trim());

describe('REQ-PLAY-001 the playground: a mock browser and its controls', () => {
  it('names the four color presets and offers a custom color', () => {
    render(<Playground t={en.t} />);
    expect(labelsIn('Color', 'radio')).toEqual(['Red', 'Amber', 'Blue', 'Slate', 'Custom']);
    expect(screen.getByRole('radio', { name: 'Red' })).toHaveProperty('checked', true);
    expect(screen.getByRole('textbox', { name: 'Custom color' })).toHaveProperty(
      'value',
      '#c93a2e',
    );
  });

  it('offers every page effect, the ribbon corner and the banner edge', () => {
    render(<Playground t={en.t} />);
    expect(labelsIn('Effects on the page', 'checkbox')).toEqual([
      'Ribbon',
      'Banner',
      'Frame',
      'Tint',
      'Stripes',
      'Watermark',
      'Title prefix',
    ]);
    const corner = screen.getByRole('combobox', { name: 'Ribbon corner' });
    expect(names(within(corner).getAllByRole('option'))).toEqual([
      'Top left',
      'Top right',
      'Bottom left',
      'Bottom right',
    ]);
    const edge = screen.getByRole('combobox', { name: 'Banner edge' });
    expect(names(within(edge).getAllByRole('option'))).toEqual(['Top', 'Bottom']);
  });

  it('offers the element effects on the sample button', () => {
    render(<Playground t={en.t} />);
    expect(labelsIn('Effects on the Delete customer button', 'checkbox')).toEqual([
      'Outline',
      'Tint',
      'Stripes',
      'Ribbon',
    ]);
  });

  it('shows a mock browser: tab title, sample address and the Delete customer button', () => {
    render(<Playground t={en.t} />);
    const preview = screen.getByRole('figure', { name: 'Preview of a marked page' });
    expect(preview.textContent).toContain('Customers');
    expect(preview.textContent).toContain('https://admin.example.com/customers');
    expect(preview.textContent).toContain('Delete customer');
  });

  it('follows the controls', () => {
    render(<Playground t={en.t} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toHaveProperty('checked', true);
    expect(screen.getByRole('textbox', { name: 'Custom color' })).toHaveProperty(
      'value',
      '#1f6feb',
    );
    const banner = within(group('Effects on the page')).getByRole('checkbox', { name: 'Banner' });
    expect(banner).toHaveProperty('checked', true);
    fireEvent.click(banner);
    expect(banner).toHaveProperty('checked', false);
    const corner = screen.getByRole('combobox', { name: 'Ribbon corner' });
    fireEvent.change(corner, { target: { value: 'bottom-left' } });
    expect(corner).toHaveProperty('value', 'bottom-left');
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

describe('REQ-PLAY-006 custom input shows the options page messages', () => {
  it('refuses a custom color that is not a hex color', () => {
    render(<Playground t={en.t} />);
    const field = screen.getByRole('textbox', { name: 'Custom color' });
    fireEvent.change(field, { target: { value: 'blue' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a color like #1f6feb.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Custom' })).toHaveProperty('checked', true);
    fireEvent.change(field, { target: { value: '#00ff88' } });
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByText('Enter a color like #1f6feb.')).toBeNull();
  });

  it('refuses an empty mark text', () => {
    render(<Playground t={en.t} />);
    const field = screen.getByRole('textbox', { name: 'Mark text' });
    fireEvent.change(field, { target: { value: '   ' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText("Enter a text, so the mark doesn't rely on color alone.")).toBeTruthy();
  });

  it('takes at most 16 characters of mark text, the ribbon limit', () => {
    render(<Playground t={en.t} />);
    expect(screen.getByRole('textbox', { name: 'Mark text' }).getAttribute('maxlength')).toBe('16');
  });
});

describe('REQ-PLAY-005 the playground is accessible', () => {
  it('has no axe violations, also while a field shows an error', async () => {
    const { container } = render(<Playground t={en.t} />);
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom color' }), {
      target: { value: 'nope' },
    });
    expect(await axeViolations(container)).toEqual([]);
  });

  it('labels every control', () => {
    const { container } = render(<Playground t={en.t} />);
    const controls = [...container.querySelectorAll('input, select')];
    expect(controls.length).toBeGreaterThan(15);
    for (const control of controls) {
      const name = control.id
        ? container.querySelector(`label[for="${control.id}"]`)?.textContent
        : control.closest('label')?.textContent;
      expect(name?.trim(), `${control.tagName} ${control.getAttribute('type')}`).toBeTruthy();
    }
  });

  it('tells assistive technology what the preview shows, in words', () => {
    render(<Playground t={en.t} />);
    const status = screen.queryByRole('status');
    expect(status?.textContent).toBe(
      'The page shows ribbon, banner in red with the text “PROD”. ' +
        'The Delete customer button has outline.',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Slate' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Frame' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Mark text' }), {
      target: { value: 'LIVE' },
    });
    expect(status?.textContent).toBe(
      'The page shows ribbon, banner, frame in slate with the text “LIVE”. ' +
        'The Delete customer button has outline.',
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom color' }), {
      target: { value: '#00aa55' },
    });
    expect(status?.textContent).toContain('in #00aa55 with');
  });

  it('says so when the preview shows no marks', () => {
    render(<Playground t={en.t} />);
    const page = within(group('Effects on the page'));
    fireEvent.click(page.getByRole('checkbox', { name: 'Ribbon' }));
    fireEvent.click(page.getByRole('checkbox', { name: 'Banner' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Outline' }));
    expect(screen.queryByRole('status')?.textContent).toBe('The preview shows no marks.');
  });

  it('describes the hero preview too, and names its presets', async () => {
    const { container } = render(<HeroPlayground t={en.t} />);
    expect(screen.queryByRole('status')?.textContent).toContain('in red');
    fireEvent.click(screen.getByRole('radio', { name: 'Amber' }));
    expect(screen.queryByRole('status')?.textContent).toContain('in amber');
    expect(await axeViolations(container)).toEqual([]);
  });
});
