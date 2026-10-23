import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Micro-animations (docs/design.md §7): short, played once, built on --sm-duration so reduced motion makes them instant.

const read = (file: string) => readFileSync(file, 'utf8');
const tokens = read('src/styles/tokens.css');
const base = read('src/styles/base.css');
const links = read('src/styles/links.css');
const css = {
  Switch: read('src/ui/components/Switch.module.css'),
  Toast: read('src/ui/components/Toast.module.css'),
  GroupList: read('src/entrypoints/options/groups/GroupList.module.css'),
};

describe('REQ-A11Y-007 motion is instant under reduced motion', () => {
  it('zeroes --sm-duration', () => {
    expect(tokens).toMatch(/prefers-reduced-motion: reduce\)\s*{[^@]*--sm-duration:\s*0ms/);
  });

  it.each([
    ['sm-tape-on tape', base.match(/animation:\s*sm-tape-on[^;]*;/)?.[0]],
    ['toast', css.Toast.match(/animation:\s*rise[^;]*;/)?.[0]],
    ['new group row', css.GroupList.match(/animation:\s*drop-in[^;]*;/)?.[0]],
    ['theme fade', base.match(/view-transition-group\(root\)\s*{[^}]*}/)?.[0]],
    ['switch knob', css.Switch.match(/transition:\s*transform[^;]*;/)?.[0]],
    ['nav squiggle', links.match(/transition:\s*clip-path[^;]*;/)?.[0]],
  ])('the %s derives its time from --sm-duration', (_name, rule) => {
    expect(rule).toMatch(/var\(--sm-duration\)/);
  });
});

describe('REQ-THEME-001 the header squiggle is drawn, never a straight or dashed line', () => {
  it('is a tiled wave mask that is revealed left to right', () => {
    expect(links).toMatch(/mask:\s*url\('\.\.\/assets\/wave\.svg'\) repeat-x/);
    expect(links).toMatch(/clip-path:\s*inset\(0 100% 0 0\)/);
  });

  it('forced colors keep the text decoration', () => {
    expect(links).toMatch(/@media \(forced-colors: none\)/);
  });
});

describe('REQ-THEME-001 the wordmark animates itself and rests when motion is reduced', () => {
  it.each(['sitemark-wordmark', 'sitemark-wordmark-dark'])('%s.svg', (name) => {
    const svg = read(`design/logo/${name}.svg`);
    expect(svg).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{ \.win, \.rib, \.dot, \.t1, \.t2 { animation: none/,
    );
    for (const part of ['win', 'rib', 'dot', 't1', 't2']) expect(svg).toContain(`class="${part}"`);
  });

  it('the extension keeps its wordmarks still', () => {
    expect(read('src/assets/wordmark.svg')).not.toContain('@keyframes');
    expect(read('src/assets/wordmark-dark.svg')).not.toContain('@keyframes');
  });
});
