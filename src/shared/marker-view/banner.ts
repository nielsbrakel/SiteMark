import type { EffectView, PageItemOf, ViewContext } from './effect-view';
import { assembleView, createNode, createRoot } from './view-dom';

type BannerItem = PageItemOf<'banner'>;

/**
 * A bar on the top or bottom edge with the merged text, exposed as a note (REQ-MARK-005,
 * REQ-A11Y-006). Its chevron collapses that banner to a 24 × 24 tab; the collapse lives in
 * `ctx.collapsedBanners` under the item's key, so it outlasts updates and re-mounts.
 */
export function createBannerView(item: BannerItem, ctx: ViewContext): EffectView<BannerItem> {
  const root = createRoot(ctx, 'sm-banner', false);
  root.setAttribute('role', 'note');
  const glyph = createNode(ctx, 'span', 'sm-banner__glyph');
  glyph.setAttribute('aria-hidden', 'true');
  const text = createNode(ctx, 'span', 'sm-banner__text');
  const chevron = createNode(ctx, 'button', 'sm-banner__chevron');
  chevron.type = 'button';
  root.append(glyph, text, chevron);

  let key = item.key;
  const showCollapsed = () => {
    const isCollapsed = ctx.collapsedBanners.has(key);
    root.toggleAttribute('data-collapsed', isCollapsed);
    chevron.setAttribute('aria-expanded', String(!isCollapsed));
    const { collapseBanner, expandBanner } = ctx.labels;
    chevron.setAttribute('aria-label', isCollapsed ? expandBanner : collapseBanner);
  };
  chevron.addEventListener('click', () => {
    if (!ctx.collapsedBanners.delete(key)) ctx.collapsedBanners.add(key);
    showCollapsed();
  });

  return assembleView(item, ctx, root, {
    render: (next) => {
      key = next.key;
      root.dataset.edge = next.params.edge === 'bottom' ? 'bottom' : 'top';
      root.dataset.size = next.params.size === 'regular' ? 'regular' : 'compact';
      text.textContent = next.params.text;
      showCollapsed();
    },
  });
}
