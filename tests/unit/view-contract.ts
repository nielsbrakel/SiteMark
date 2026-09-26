import { afterEach, describe, expect, it } from 'vitest';
import type { Hex } from '../../src/core/model/schema';
import type { DrawnItem, EffectView, ViewContext } from '../../src/shared/marker-view/effect-view';
import { markerViewCss } from '../../src/shared/marker-view/marker-view-css';
import { addStyles, aViewContext, BLUE, customProperty, resetDocument } from './marker-view';

type Factory<I extends DrawnItem> = (item: I, ctx: ViewContext) => EffectView<I>;

type ContractOptions = {
  /** Decorative overlays are hidden from assistive technology (REQ-A11Y-006). */
  readonly decorative: boolean;
};

/**
 * What every effect view does, whatever it draws: it lives in the container, never takes input,
 * gets its colors only as validated hex (REQ-RND-011), stacks by `z` and disposes cleanly.
 * `title` starts with the REQ IDs, e.g. `'REQ-MARK-004 page tint'`.
 */
export function describeViewContract<I extends DrawnItem>(
  title: string,
  create: Factory<I>,
  item: I,
  options: ContractOptions,
): void {
  describe(`${title} view contract (REQ-RND-002, REQ-RND-011)`, () => {
    afterEach(resetDocument);

    it('appends one node to the container that never intercepts input', () => {
      const ctx = aViewContext();
      addStyles(markerViewCss());
      const view = create(item, ctx);
      expect([...ctx.container.children]).toEqual([view.el]);
      expect(getComputedStyle(view.el).pointerEvents).toBe('none');
    });

    it(options.decorative ? 'is hidden from assistive technology' : 'is exposed to AT', () => {
      const view = create(item, aViewContext());
      expect(view.el.getAttribute('aria-hidden')).toBe(options.decorative ? 'true' : null);
    });

    it('sets the mark and text colors as custom properties, and stacks by z', () => {
      const view = create(item, aViewContext());
      expect(customProperty(view.el, '--sm-mark-color')).toBe(item.color);
      expect(customProperty(view.el, '--sm-mark-text')).toBe(item.textColor);
      expect(view.el.style.zIndex).toBe(String(item.z));
    });

    it('applies new colors and z on update', () => {
      const view = create(item, aViewContext());
      view.update({ ...item, color: BLUE, textColor: '#000000' as Hex, z: 9 });
      expect(customProperty(view.el, '--sm-mark-color')).toBe(BLUE);
      expect(customProperty(view.el, '--sm-mark-text')).toBe('#000000');
      expect(view.el.style.zIndex).toBe('9');
    });

    it('drops a color that is not a validated lowercase hex', () => {
      const hostile = { ...item, color: 'red;x:y' as Hex, textColor: '#FFFFFF' as Hex };
      const view = create(hostile, aViewContext());
      expect(customProperty(view.el, '--sm-mark-color')).toBe('');
      expect(customProperty(view.el, '--sm-mark-text')).toBe('');
      expect(view.el.getAttribute('style') ?? '').not.toContain('red');
    });

    it('removes its nodes on dispose, and a second dispose is harmless', () => {
      const ctx = aViewContext();
      const view = create(item, ctx);
      view.dispose();
      view.dispose();
      expect(ctx.container.children).toHaveLength(0);
    });
  });
}
