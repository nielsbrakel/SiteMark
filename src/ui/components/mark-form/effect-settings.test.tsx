import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { byLabel, byRole } from '../../../../tests/unit/queries';
import { OutlineSettings, StripesSettings, TintSettings } from './range-effect-settings';
import {
  BannerSettings,
  RibbonSettings,
  TitlePrefixSettings,
  WatermarkSettings,
} from './text-effect-settings';
import { TranslateContext } from './translate';

// REQ-OPT-003 and REQ-OPT-006: every effect's settings report their new value through `set`.

// The key is the label: tests read the controls by the key they are translated from.
const wrap = (node: ReactNode) => (
  <TranslateContext value={(key, substitution) => (substitution ? `${key} ${substitution}` : key)}>
    {node}
  </TranslateContext>
);

function pick(group: string, option: string) {
  fireEvent.click(byRole('radio', { name: option }, byRole('radiogroup', { name: group })));
}

describe('REQ-OPT-003 the text effects save their text on blur and their choices at once', () => {
  it('ribbon: text and corner', () => {
    const set = vi.fn();
    render(wrap(<RibbonSettings value={{ text: 'PROD', corner: 'top-right' }} set={set} />));
    fireEvent.change(byLabel('optionsRibbonText'), { target: { value: ' LIVE ' } });
    fireEvent.blur(byLabel('optionsRibbonText'));
    pick('optionsRibbonCorner', 'cornerTopLeft');
    expect(set.mock.calls).toEqual([
      [{ text: 'LIVE', corner: 'top-right' }],
      [{ text: 'PROD', corner: 'top-left' }],
    ]);
  });

  it('banner: text, edge and size', () => {
    const set = vi.fn();
    render(
      wrap(<BannerSettings value={{ text: 'PROD', edge: 'top', size: 'compact' }} set={set} />),
    );
    fireEvent.change(byLabel('optionsBannerText'), { target: { value: 'LIVE' } });
    fireEvent.blur(byLabel('optionsBannerText'));
    pick('optionsBannerEdge', 'edgeBottom');
    pick('optionsBannerSize', 'sizeRegular');
    expect(set.mock.calls).toEqual([
      [{ text: 'LIVE', edge: 'top', size: 'compact' }],
      [{ text: 'PROD', edge: 'bottom', size: 'compact' }],
      [{ text: 'PROD', edge: 'top', size: 'regular' }],
    ]);
  });

  it('watermark: text, and opacity once the slider stops moving', () => {
    vi.useFakeTimers();
    const set = vi.fn();
    render(wrap(<WatermarkSettings value={{ text: 'PROD', opacityPct: 6 }} set={set} />));
    fireEvent.change(byLabel('optionsWatermarkText'), { target: { value: 'LIVE' } });
    fireEvent.blur(byLabel('optionsWatermarkText'));
    fireEvent.change(byRole('slider', { name: 'optionsWatermarkOpacity' }), {
      target: { value: '12' },
    });
    expect(set).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(500));
    expect(set.mock.calls).toEqual([
      [{ text: 'LIVE', opacityPct: 6 }],
      [{ text: 'PROD', opacityPct: 12 }],
    ]);
    vi.useRealTimers();
  });

  it('title prefix: only the text, and an empty text is refused', () => {
    const set = vi.fn();
    render(wrap(<TitlePrefixSettings value={{ text: 'PROD' }} set={set} />));
    fireEvent.change(byLabel('optionsTitlePrefixText'), { target: { value: '  ' } });
    fireEvent.blur(byLabel('optionsTitlePrefixText'));
    expect(set).not.toHaveBeenCalled();
    expect(screen.getByText('optionsTextRequired')).toBeInTheDocument();
    fireEvent.change(byLabel('optionsTitlePrefixText'), { target: { value: 'LIVE' } });
    fireEvent.blur(byLabel('optionsTitlePrefixText'));
    expect(set).toHaveBeenCalledWith({ text: 'LIVE' });
  });
});

describe('REQ-OPT-003 the effects without text save their ranges after the slider stops', () => {
  function slide(name: string, value: string) {
    fireEvent.change(byRole('slider', { name }), { target: { value } });
    act(() => vi.advanceTimersByTime(500));
  }

  it('tint (page and element ranges), stripes (area on pages only) and outline', () => {
    vi.useFakeTimers();
    const set = vi.fn();
    const view = render(wrap(<TintSettings value={{ opacityPct: 8 }} target="page" set={set} />));
    slide('optionsTintOpacity', '10');
    view.rerender(
      wrap(<StripesSettings value={{ opacityPct: 20, area: 'edge' }} target="page" set={set} />),
    );
    slide('optionsStripesOpacity', '30');
    pick('optionsStripesArea', 'areaFull');
    view.rerender(wrap(<StripesSettings value={{ opacityPct: 20 }} target="element" set={set} />));
    expect(screen.queryByRole('radiogroup', { name: 'optionsStripesArea' })).toBeNull();
    view.rerender(
      wrap(<OutlineSettings value={{ widthPx: 2, style: 'solid', pulse: false }} set={set} />),
    );
    slide('optionsOutlineWidth', '4');
    pick('optionsOutlineStyle', 'styleDotted');
    fireEvent.click(byRole('switch', { name: 'optionsOutlinePulse' }));
    expect(set.mock.calls).toEqual([
      [{ opacityPct: 10 }],
      [{ opacityPct: 30, area: 'edge' }],
      [{ opacityPct: 20, area: 'full' }],
      [{ widthPx: 4, style: 'solid', pulse: false }],
      [{ widthPx: 2, style: 'dotted', pulse: false }],
      [{ widthPx: 2, style: 'solid', pulse: true }],
    ]);
    vi.useRealTimers();
  });
});
