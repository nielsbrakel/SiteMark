import fc from 'fast-check';
import type { MarkId } from '../ids';
import type {
  ElementEffects,
  ElementMark,
  MarkBase,
  PageEffects,
  PageMark,
  Ribbon,
} from '../model/schema';
import { anId, hex, userText } from './field-arbitraries';

// fast-check generators for schema-valid marks (T-058), every effect within its spec §7 limits.

const pct = (min: number, max: number) => fc.integer({ min, max });
/** Only records with at least one effect: a mark needs one. */
const hasEffect = (effects: object): boolean => Object.keys(effects).length > 0;

const ribbon: fc.Arbitrary<Ribbon> = fc.record({
  text: userText(1, 16),
  corner: fc.constantFrom('top-left', 'top-right', 'bottom-left', 'bottom-right'),
});

const pageEffects: fc.Arbitrary<PageEffects> = fc
  .record(
    {
      ribbon,
      banner: fc.record({
        text: userText(1, 60),
        edge: fc.constantFrom('top', 'bottom'),
        size: fc.constantFrom('compact', 'regular'),
      }),
      frame: fc.record({ widthPx: pct(2, 16) }),
      tint: fc.record({ opacityPct: pct(3, 15) }),
      stripes: fc.record({ opacityPct: pct(5, 40), area: fc.constantFrom('edge', 'full') }),
      watermark: fc.record({ text: userText(1, 24), opacityPct: pct(4, 12) }),
      titlePrefix: fc.record({ text: userText(1, 16) }),
      favicon: fc.constant({}),
    },
    { requiredKeys: [] },
  )
  .filter(hasEffect);

const elementEffects: fc.Arbitrary<ElementEffects> = fc
  .record(
    {
      ribbon,
      outline: fc.record({
        widthPx: pct(1, 8),
        style: fc.constantFrom('solid', 'dashed', 'dotted'),
        pulse: fc.boolean(),
      }),
      tint: fc.record({ opacityPct: pct(5, 40) }),
      stripes: fc.record({ opacityPct: pct(5, 40) }),
    },
    { requiredKeys: [] },
  )
  .filter(hasEffect);

const markBase: fc.Arbitrary<MarkBase> = fc.record(
  {
    id: anId<MarkId>(),
    label: userText(0, 40),
    enabled: fc.boolean(),
    color: hex,
    textColor: fc.oneof(fc.constant('auto' as const), hex),
  },
  { requiredKeys: ['id', 'enabled', 'color', 'textColor'] },
);

export const pageMark: fc.Arbitrary<PageMark> = fc
  .tuple(markBase, pageEffects)
  .map(([base, effects]) => ({ ...base, target: { kind: 'page' }, effects }));

export const elementMark: fc.Arbitrary<ElementMark> = fc
  .tuple(markBase, fc.string({ minLength: 1, maxLength: 60, unit: 'binary' }), elementEffects)
  .map(([base, selector, effects]) => ({
    ...base,
    target: { kind: 'element', selector },
    effects,
  }));
