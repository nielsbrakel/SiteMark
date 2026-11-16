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

describe('REQ-PICK-002 the selection outline is solid and two-tone', () => {
  it('draws 3 px ink inside 3 px white, never dashed, with taped corners', () => {
    const outline = rule(GLASS_PANE_CSS, '.sm-outline');
    expect(outline).toMatch(/border:\s*3px solid var\(--sm-picker-dark\)/);
    expect(outline).toMatch(/outline:\s*3px solid var\(--sm-picker-light\)/);
    expect(GLASS_PANE_CSS).not.toMatch(/dashed/);
    expect(GLASS_PANE_CSS).toMatch(/\.sm-outline::after \{[^}]*var\(--sm-tape-2\)/);
  });
});

describe('REQ-PICK-005 the panel is ruled paper with a coral margin line', () => {
  it('uses the notebook sheet and draws the margin line', () => {
    expect(rule(PANEL_CSS, '.sm-panel')).toMatch(/background:\s*var\(--sm-paper\)/);
    expect(rule(PANEL_CSS, '.sm-panel::before')).toMatch(/background:\s*var\(--sm-accent\)/);
  });
});
