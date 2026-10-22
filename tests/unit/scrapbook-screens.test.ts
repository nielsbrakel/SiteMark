import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Extension screens are paper sheets on the kraft board; their headers sit on the board (D-289, docs/design.md §4).

const css = (file: string) => readFileSync(`src/entrypoints/${file}.module.css`, 'utf8');
const sheet =
  /border:\s*1\.5px solid var\(--sm-control-border\)[^}]*background:\s*var\(--sm-paper\)/;

describe('REQ-THEME-001 screens are paper sheets on the board', () => {
  it.each(['popup/App', 'grant/App'])('%s draws its page as an outlined sheet', (file) => {
    expect(css(file)).toMatch(sheet);
  });

  it('the options sidebar and editor share one ruled sheet', () => {
    expect(css('options/Layout')).toMatch(/\.sheet\s*{[^}]*--sm-control-border/);
  });

  it('the popup header sits on the board, above the taped sheet', () => {
    expect(css('popup/App')).toMatch(/\.header\s*{[^}]*}[\s\S]*\.sheet\s*{[^}]*--tape/);
  });

  it('the current group is taped with ink text', () => {
    expect(css('options/groups/GroupList')).toMatch(/var\(--sm-tape-1\)[^}]*var\(--sm-on-tape\)/);
  });
});
