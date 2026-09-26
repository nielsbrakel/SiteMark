import { afterEach, describe, expect, it } from 'vitest';
import type { DrawnItem, EffectView, ViewContext } from '../../src/shared/marker-view/effect-view';
import { aViewContext, resetDocument } from './marker-view';

type Factory<I extends DrawnItem> = (item: I, ctx: ViewContext) => EffectView<I>;

const RECT = { left: 10, top: 20, width: 200, height: 100 };

/**
 * What every element view does with the rect the tracker (T-095) gives it: nothing shows until
 * the target is found, the view sits on the target's box, and it hides while the target is
 * missing or hidden (REQ-RND-003, REQ-RND-005). `title` starts with the REQ IDs.
 */
export function describeElementViewContract<I extends DrawnItem>(
  title: string,
  create: Factory<I>,
  item: I,
): void {
  describe(`${title} on the target's box (REQ-RND-003, REQ-RND-005)`, () => {
    afterEach(resetDocument);

    it('stays hidden until it gets the target rect', () => {
      const view = create(item, aViewContext());
      expect(view.el.hidden).toBe(true);
    });

    it('sits on the target box, in container coordinates', () => {
      const view = create(item, aViewContext());
      view.setRect(RECT);
      expect(view.el.hidden).toBe(false);
      expect(view.el.style.transform).toBe('translate(10px, 20px)');
      expect([view.el.style.width, view.el.style.height]).toEqual(['200px', '100px']);
    });

    it('follows the target when the rect changes, and keeps it through updates', () => {
      const view = create(item, aViewContext());
      view.setRect(RECT);
      view.setRect({ ...RECT, left: -5.5, top: 300 });
      view.update(item);
      expect(view.el.style.transform).toBe('translate(-5.5px, 300px)');
      expect(view.el.hidden).toBe(false);
    });

    it('hides while the target is missing or the rect is unusable', () => {
      const view = create(item, aViewContext());
      view.setRect(RECT);
      view.setRect(null);
      expect(view.el.hidden).toBe(true);
      view.setRect({ ...RECT, width: Number.NaN });
      expect(view.el.hidden).toBe(true);
    });
  });
}
