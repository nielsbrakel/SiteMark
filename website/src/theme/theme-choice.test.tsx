import { afterEach, describe, expect, it } from 'vitest';
import { applyThemeColor } from './theme-choice';

const LIGHT = '#c9a77c';
const DARK = '#17121f';

/** The two tags the document renders: one per scheme, each remembering its own colour. */
function themeColorTags() {
  return (['light', 'dark'] as const).map((scheme) => {
    const color = scheme === 'light' ? LIGHT : DARK;
    const tag = document.createElement('meta');
    tag.name = 'theme-color';
    tag.content = color;
    tag.dataset.color = color;
    tag.setAttribute('media', `(prefers-color-scheme: ${scheme})`);
    document.head.append(tag);
    return tag;
  });
}

afterEach(() => {
  document.head.replaceChildren();
});

describe('REQ-WEBUX-002 the toolbar colour follows the chosen theme', () => {
  it('forces both tags to the chosen theme, and System restores each one', () => {
    const tags = themeColorTags();
    const colors = () => tags.map((tag) => tag.content);

    applyThemeColor('dark');
    expect(colors()).toEqual([DARK, DARK]);
    applyThemeColor('light');
    expect(colors()).toEqual([LIGHT, LIGHT]);
    applyThemeColor('system');
    expect(colors()).toEqual([LIGHT, DARK]);
  });
});
