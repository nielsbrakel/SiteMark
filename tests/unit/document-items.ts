import type { MarkId } from '../../src/core/ids';
import type { Hex } from '../../src/core/model/schema';
import type { RenderItem } from '../../src/core/render/render-plan';

// Test support for the document effects (src/content/marker/document-effects.ts): the two render
// items that aren't drawn in the page. Used by the dom and the browser tests.

type DocumentItem<E extends 'titlePrefix' | 'favicon'> = Extract<
  RenderItem,
  { target: 'page'; effect: E }
>;

const MARK = 'mark00000001' as MarkId;

function base(effect: string, color: string) {
  return {
    key: `${MARK}:${effect}`,
    markIds: [MARK],
    color: color as Hex,
    textColor: '#ffffff' as Hex,
    z: 0,
    target: 'page',
  } as const;
}

/** A title prefix item with `text` as the prefix. */
export function aTitlePrefixItem(text: string): DocumentItem<'titlePrefix'> {
  return { ...base('titlePrefix', '#c93a2e'), effect: 'titlePrefix', params: { text } };
}

/** A favicon tint item in `color` (red by default; unvalidated, so tests can pass bad values). */
export function aFaviconItem(color = '#c93a2e'): DocumentItem<'favicon'> {
  return { ...base('favicon', color), effect: 'favicon', params: {} };
}
