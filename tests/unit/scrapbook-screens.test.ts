import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Extension screens are paper sheets on the kraft board; the popup header is torn tape (D-289, docs/design.md §4).

const css = (file: string) => readFileSync(`src/entrypoints/${file}.module.css`, 'utf8');
const sheet =
  /border:\s*1\.5px solid var\(--sm-control-border\)[^}]*background:\s*var\(--sm-paper\)/;

describe('REQ-THEME-001 screens are paper sheets on the board', () => {
  it.each(['popup/App', 'grant/App'])('%s draws its page as an outlined sheet', (file) => {
    expect(css(file)).toMatch(sheet);
  });

  it('the options header, sidebar, main and footer share the sheet look (the footer is a plain wavy-divider strip)', () => {
    const layout = css('options/Layout');
    expect(layout).toMatch(/\.header,\s*\.sidebar,\s*\.main\s*{[^}]*--sm-control-border/);
  });

  it('the popup header is a tape strip with a torn edge', () => {
    const popup = css('popup/App');
    expect(popup).toMatch(/\.header\s*{[^}]*background:\s*var\(--sm-tape-1\)[^}]*mask:/);
    expect(popup).toMatch(/forced-colors[^}]*\.header\s*{[^}]*mask:\s*none/);
  });

  it('the current group is taped with ink text', () => {
    expect(css('options/groups/GroupList')).toMatch(/var\(--sm-tape-1\)[^}]*var\(--sm-on-tape\)/);
  });
});
