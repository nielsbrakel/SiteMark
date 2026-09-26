import type { EffectView, PageItemOf, ViewContext } from './effect-view';
import { assembleView, createNode, createRoot } from './view-dom';

type BannerItem = PageItemOf<'banner'>;

/** A bar on the top or bottom edge with the merged text, exposed as a note (REQ-MARK-005). */
export function createBannerView(item: BannerItem, ctx: ViewContext): EffectView<BannerItem> {
  const root = createRoot(ctx, 'sm-banner', false);
  root.setAttribute('role', 'note');
  const glyph = createNode(ctx, 'span', 'sm-banner__glyph');
  glyph.setAttribute('aria-hidden', 'true');
  const text = createNode(ctx, 'span', 'sm-banner__text');
  root.append(glyph, text);
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      root.dataset.edge = params.edge === 'bottom' ? 'bottom' : 'top';
      root.dataset.size = params.size === 'regular' ? 'regular' : 'compact';
      text.textContent = params.text;
    },
  });
}
