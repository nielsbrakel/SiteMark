import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import stylelint from 'stylelint';
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

describe('REQ-THEME-002 links take the accent text token, not the browser default blue', () => {
  const base = readFileSync('src/styles/base.css', 'utf8');

  it('colors every link with --sm-accent-text in light and dark', () => {
    expect(base).toMatch(/(^|\n)a\s*{[^}]*color:\s*var\(--sm-accent-text\)/);
  });

  it('leaves links to the system LinkText color in forced colors', () => {
    expect(forcedColorsBlock(base)).toMatch(/(^|\s)a\s*{[^}]*color:\s*LinkText/);
  });
});

describe('REQ-WEBUX-001 the website uses the extension design system and never its own colors', () => {
  const lintCss = async (code: string) =>
    (
      await stylelint.lint({ code, codeFilename: 'website/src/components/Example.module.css' })
    ).results[0]?.warnings.map((warning) => warning.rule) ?? [];

  it('loads the shared tokens and base styles before its own layout tokens', () => {
    const entry = readFileSync('website/src/entry-client.ts', 'utf8');
    expect(entry.indexOf("import '@/styles/base.css';")).toBe(0);
    expect(readFileSync('src/styles/base.css', 'utf8')).toMatch(
      /^@import url\('\.\/tokens\.css'\);/,
    );
  });

  it('keeps colors and shadows out of the website-only tokens', () => {
    const declarations = readFileSync('website/src/styles/website-tokens.css', 'utf8').match(
      /--[\w-]+:[^;]+;/g,
    );
    expect(declarations?.length).toBeGreaterThan(0);
    expect(declarations?.filter((d) => /color|shadow|#[0-9a-f]{3}|rgb|hsl|oklch/i.test(d))).toEqual(
      [],
    );
  });

  it('lets stylelint refuse raw colors in website CSS, and accept tokens', async () => {
    expect(await lintCss('.a { color: #fff; }\n')).toContain('color-no-hex');
    expect(await lintCss('.a { background: rgb(0 0 0); }\n')).toContain('function-disallowed-list');
    expect(await lintCss('.a { color: red; }\n')).toContain('color-named');
    expect(await lintCss('.a { color: var(--sm-text); }\n')).toEqual([]);
  });

  it('lints every website stylesheet (package.json)', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
    expect(scripts.stylelint).toContain("'website/src/**/*.css'");
    expect(scripts['check:ci']).toContain("'website/src/**/*.css'");
  });
});
