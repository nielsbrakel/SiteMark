import type { RenderItem } from '../../core/render/render-plan';

// The contract between the marker renderer (src/content/marker) or the options preview and the
// effect views in this folder. Views are plain DOM (D-101): no React, no browser.* and no page
// access, so the same code draws the marks in a tab, in the options preview and on the website.

/** A render item that is drawn in the page (title prefix and favicon are document effects). */
export type DrawnItem = Exclude<RenderItem, { readonly effect: 'titlePrefix' | 'favicon' }>;

type Effect = DrawnItem['effect'];

/** A page item of one effect, e.g. `PageItemOf<'banner'>`. */
export type PageItemOf<E extends Effect> = Extract<DrawnItem, { target: 'page'; effect: E }>;

/**
 * The target element's box in the container's coordinates (in a tab: the viewport, so a
 * `getBoundingClientRect()` result fits). Non-finite values hide the view.
 */
export type ViewRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/** Translated labels for the few interactive parts (the caller owns i18n). */
export type ViewLabels = {
  /** The banner's chevron while the banner is expanded. */
  readonly collapseBanner: string;
  /** The collapsed banner's tab. */
  readonly expandBanner: string;
};

export type ViewContext = {
  /**
   * Where the view appends its nodes: a positioned box that covers the viewport (in a tab, a
   * container inside the `<sitemark-root>` shadow root) with the styles of `markerViewCss()`.
   */
  readonly container: HTMLElement;
  /**
   * Keys of the banners the user collapsed. One set per document, owned by the caller, so a
   * collapse survives new plans and SPA navigations and resets on reload (REQ-MARK-005).
   */
  readonly collapsedBanners: Set<string>;
  readonly labels: ViewLabels;
};

/** One drawn effect. Created by a `create…View(item, ctx)` factory, already in `ctx.container`. */
export type EffectView<I extends DrawnItem = DrawnItem> = {
  /** The view's outermost node. */
  readonly el: HTMLElement;
  /** Applies a newer item with the same key (same effect and target kind). */
  update(item: I): void;
  /**
   * Element effects: where the target is, or `null` while it is missing, hidden or detached
   * (the view hides). Element views stay hidden until the first rect. Page views ignore it.
   */
  setRect(rect: ViewRect | null): void;
  /** Removes the view's nodes. Safe to call twice. */
  dispose(): void;
};
