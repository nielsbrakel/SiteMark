import { createHost, type Host, type HostOptions } from '../../src/content/marker/host';

// Shared by the host browser tests: creates hosts that are disposed after each test, plus page
// fixtures that are removed again.

const created: Host[] = [];
const pageNodes: Node[] = [];

/** A host whose extension context stays alive unless the test says otherwise. */
export function aHost(options: HostOptions = {}): Host {
  const host = createHost({ isAlive: () => true, ...options });
  created.push(host);
  return host;
}

/** The `<sitemark-root>` element, reached through the (open, in tests) shadow root. */
export function elementOf(host: Host): HTMLElement {
  return (host.root.getRootNode() as ShadowRoot).host as HTMLElement;
}

/** Adds a page stylesheet, as a hostile page would. */
export function pageStyle(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  pageNodes.push(style);
  return style;
}

/** A `<sitemark-root>` planted by the page on `document.documentElement`. */
export function plantedRoot(): HTMLElement {
  const planted = document.createElement('sitemark-root');
  planted.textContent = 'planted by the page';
  document.documentElement.append(planted);
  pageNodes.push(planted);
  return planted;
}

export function cleanUp(): void {
  for (const host of created.splice(0)) host.dispose();
  for (const node of pageNodes.splice(0)) node.parentNode?.removeChild(node);
}
