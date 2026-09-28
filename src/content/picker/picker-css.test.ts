import { describe, expect, it } from 'vitest';
import { GLASS_PANE_CSS } from './glass-pane-css';
import { PANEL_CSS } from './panel-css';

/** The declarations of the first rule whose selector is exactly `selector`. */
function rule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  return start < 0 ? '' : css.slice(start, css.indexOf('}', start));
}

describe('REQ-A11Y-012 the picker hint reflows instead of cutting off its instructions', () => {
  it('wraps the hint text at narrow widths and high zoom (WCAG 1.4.10)', () => {
    const hint = rule(GLASS_PANE_CSS, '.sm-hint');
    expect(hint).toMatch(/white-space:\s*normal/);
    expect(hint).not.toMatch(/text-overflow:\s*ellipsis/);
  });
});

describe('REQ-A11Y-003 the focused color swatch shows focus apart from the selection', () => {
  it('draws the selection as a ring and focus as an outline around it (WCAG 2.4.7)', () => {
    expect(rule(PANEL_CSS, '.sm-panel__swatch:checked')).toMatch(/box-shadow:/);
    expect(rule(PANEL_CSS, '.sm-panel__swatch:focus-visible')).toMatch(/outline-offset:\s*[5-9]px/);
  });
});
