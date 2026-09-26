import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const cssFiles = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.css'))
  .map((file) => path.join('src', file).replaceAll('\\', '/'));

/** The body of the first `@media (forced-colors: active)` block, or ''. */
function forcedColorsBlock(css: string): string {
  const start = css.indexOf('@media (forced-colors: active)');
  if (start < 0) return '';
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(start, i);
  }
  return '';
}

describe('REQ-THEME-002 global CSS is limited to tokens, base primitives and page shells (D-236)', () => {
  it('uses CSS Modules for component styles', () => {
    const global = cssFiles.filter((file) => !file.endsWith('.module.css'));
    const allowed = /^src\/styles\/(tokens|base)\.css$|^src\/entrypoints\/[\w-]+\/[\w-]+\.css$/;
    expect(global.filter((file) => !allowed.test(file))).toEqual([]);
  });
});

const components = readdirSync('src/ui/components').filter((file) => /^[A-Z]\w*\.tsx$/.test(file));

describe('REQ-A11Y-007 REQ-A11Y-003 every UI kit component keeps focus and forced colors (T-113)', () => {
  const moduleOf = (component: string) =>
    path.join('src/ui/components', component.replace(/\.tsx$/, '.module.css'));

  it.each(components)('%s has a CSS Module with a forced-colors block', (component) => {
    const css = existsSync(moduleOf(component)) ? readFileSync(moduleOf(component), 'utf8') : '';
    expect(forcedColorsBlock(css), moduleOf(component)).not.toBe('');
  });

  it.each(components)('%s never removes the focus outline', (component) => {
    const css = existsSync(moduleOf(component)) ? readFileSync(moduleOf(component), 'utf8') : '';
    expect(css).not.toMatch(/outline(-style)?:\s*(none|0)\b/);
  });
});

describe('REQ-A11Y-007 base styles keep boundaries, states and focus in forced colors', () => {
  const block = forcedColorsBlock(readFileSync('src/styles/base.css', 'utf8'));

  it('maps the focus ring to a system color', () => {
    expect(block).toMatch(/:focus-visible\s*{[^}]*outline-color:\s*Highlight/);
  });

  it('gives cards, wells and buttons a system-color boundary', () => {
    expect(block).toMatch(
      /\.sm-card[^{]*\.sm-well[^{]*\.sm-button[^{]*{[^}]*border-color:\s*ButtonBorder/,
    );
  });

  it('shows the pressed state without relying on shadows', () => {
    expect(block).toMatch(/aria-pressed='true'\][^{]*{[^}]*background:\s*Highlight/);
  });
});
