import type { ViewRect } from '../../shared/marker-view/effect-view';
import { markerViewCss } from '../../shared/marker-view/marker-view-css';

// The shadow root the mark preview draws in (REQ-MARK-013): the marker views' own styles, kept
// away from the page's, around a container that covers the mock viewport.

const CONTAINER_CLASS = 'sm-preview-container';
const CONTAINER_CSS = `.${CONTAINER_CLASS}{position:absolute;inset:0;overflow:hidden;}`;

/** Constructed sheets first (no CSP can block them), else one `<style>` with the same text. */
function addStyles(root: ShadowRoot, css: string): void {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
    if (root.adoptedStyleSheets.includes(sheet)) return;
  } catch {
    // Fall through to a <style> element.
  }
  const style = document.createElement('style');
  style.textContent = css;
  root.append(style);
}

/** Closed in production like the marker's (D-226), so the root is kept here, not read back. */
const roots = new WeakMap<HTMLElement, ShadowRoot>();

function shadowOf(host: HTMLElement): ShadowRoot {
  const existing = roots.get(host);
  if (existing) return existing;
  const root = host.attachShadow({ mode: __SHADOW_MODE__ });
  roots.set(host, root);
  return root;
}

/** The views' container in `host`'s shadow root, created on first use. */
export function previewContainer(host: HTMLElement): HTMLElement {
  const root = shadowOf(host);
  const existing = root.querySelector<HTMLElement>(`.${CONTAINER_CLASS}`);
  if (existing) return existing;
  addStyles(root, `${markerViewCss()}${CONTAINER_CSS}`);
  const container = document.createElement('div');
  container.className = CONTAINER_CLASS;
  root.append(container);
  return container;
}

/** Where `target` is inside `frame`, as element views expect it. */
export function rectIn(target: HTMLElement, frame: HTMLElement): ViewRect {
  const inner = target.getBoundingClientRect();
  const outer = frame.getBoundingClientRect();
  return {
    left: inner.left - outer.left,
    top: inner.top - outer.top,
    width: inner.width,
    height: inner.height,
  };
}
