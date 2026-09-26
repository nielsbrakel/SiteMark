import type { ViewContext } from '../../src/shared/marker-view/effect-view';
import { markerViewCss } from '../../src/shared/marker-view/marker-view-css';

// Test support for the browser tests of the shared marker views: a host like the marker's
// (fixed over the viewport, open shadow root, the views' adopted styles) with a container.

export type ViewHost = ViewContext & { readonly shadow: ShadowRoot };

export function mountViewHost(): ViewHost {
  const host = document.createElement('div');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('inset', '0');
  host.style.setProperty('pointer-events', 'none');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(markerViewCss());
  shadow.adoptedStyleSheets = [sheet];
  const container = document.createElement('div');
  container.style.setProperty('position', 'absolute');
  container.style.setProperty('inset', '0');
  container.style.setProperty('overflow', 'hidden');
  shadow.append(container);
  return {
    shadow,
    container,
    collapsedBanners: new Set(),
    labels: { collapseBanner: 'Collapse banner', expandBanner: 'Show banner' },
  };
}

/** The center of an element's (transformed) bounding box. */
export function centerOf(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
