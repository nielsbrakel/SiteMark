// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { HeroCompare } from './HeroCompare';

let en: WebsiteTranslator;

beforeAll(async () => {
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
});

afterEach(cleanup);

const layer = (container: HTMLElement, which: 'before' | 'after') =>
  within(container.querySelector<HTMLElement>(`[data-layer="${which}"]`) as HTMLElement);

describe('REQ-PLAY-004 the home hero compares a shop page without and with SiteMark', () => {
  it('starts with the divider near the left and moves it with the slider', () => {
    const { container } = render(<HeroCompare t={en.t} />);
    const slider = screen.getByRole('slider', { name: en.t('websiteHeroSlider') });
    const compare = container.querySelector<HTMLElement>('[data-compare]') as HTMLElement;
    expect(slider.getAttribute('value')).toBe('21');
    expect(compare.style.getPropertyValue('--pos')).toBe('21%');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(compare.style.getPropertyValue('--pos')).toBe('60%');
  });

  it('moves the divider by dragging the picture, so touch screens work too', () => {
    const { container } = render(<HeroCompare t={en.t} />);
    const compare = container.querySelector<HTMLElement>('[data-compare]') as HTMLElement;
    const frame = compare.querySelector<HTMLElement>('[data-drag]') as HTMLElement;
    frame.getBoundingClientRect = () => ({ left: 100, width: 400 }) as DOMRect;
    fireEvent.pointerDown(frame, { clientX: 300, pointerId: 1 });
    expect(compare.style.getPropertyValue('--pos')).toBe('50%');
    fireEvent.pointerMove(frame, { clientX: 400, pointerId: 1 });
    expect(compare.style.getPropertyValue('--pos')).toBe('75%');
    fireEvent.pointerUp(frame, { pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 120, pointerId: 1 });
    expect(compare.style.getPropertyValue('--pos')).toBe('75%');
    fireEvent.pointerDown(frame, { clientX: 100, pointerId: 1 });
    expect(compare.style.getPropertyValue('--pos')).toBe('8%');
  });

  it('draws the page twice and marks only the second: banner, ribbon, tab and button', () => {
    const { container } = render(<HeroCompare t={en.t} />);
    const before = layer(container, 'before');
    const after = layer(container, 'after');
    for (const text of ['Delete customer', 'Mara Jansen']) {
      expect(before.getByText(text)).toBeInTheDocument();
      expect(after.getByText(text)).toBeInTheDocument();
    }
    expect(after.getByText(en.t('websiteAtWorkMarkProduction'))).toBeInTheDocument();
    expect(after.getByText(en.t('websiteAtWorkMarkProd'))).toBeInTheDocument();
    expect(after.getByText(/^\[PROD\] Customers/)).toBeInTheDocument();
    expect(after.getByText('Delete customer').getAttribute('data-marked')).toBe('true');
    expect(before.queryByText(en.t('websiteAtWorkMarkProduction'))).toBeNull();
    expect(before.queryByText(/PROD/)).toBeNull();
    expect(before.getByText('Delete customer').getAttribute('data-marked')).toBeNull();
    expect(before.getByText(/^Customers · Leaf & Lamp/)).toBeInTheDocument();
  });

  it('labels both sides, hides the drawings from assistive technology and passes axe', async () => {
    const { container } = render(<HeroCompare t={en.t} />);
    expect(screen.getByText(en.t('websiteHeroBefore'))).toBeInTheDocument();
    expect(screen.getByText(en.t('websiteHeroAfter'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(en.t('websiteHeroHint')))).toBeInTheDocument();
    for (const which of ['before', 'after']) {
      const drawing = container.querySelector(`[data-layer="${which}"]`);
      expect(drawing?.closest('[aria-hidden="true"]')).not.toBeNull();
    }
    expect(await axeViolations(container)).toEqual([]);
  });
});
