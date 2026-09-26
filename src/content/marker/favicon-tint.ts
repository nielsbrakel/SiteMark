import { drawTinted, isHexColor, loadImage } from './favicon-image';

// The favicon tint (REQ-MARK-010, D-217, D-230): one of the three page mutations SiteMark may
// make. The page's icon links are taken out (kept, with their places) while our own link shows
// the tinted original, and they go back where they were on removal.

type Settled = 'available' | 'unavailable';

export type FaviconTint = {
  /** Tints the original favicon with `color`; `onSettled` reports the outcome. */
  apply(color: string): void;
  /** Puts the original links back and forgets any load in flight. */
  remove(): void;
};

type Placed = {
  readonly link: HTMLLinkElement;
  readonly parent: Node | null;
  readonly next: Node | null;
};

/** `<link rel~=icon>`, so also `shortcut icon` (ours is only in the page while they are out). */
function iconLinks(): HTMLLinkElement[] {
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel~=icon i]');
  return [...links];
}

/** The icon the page uses: its first icon link with an href, else `/favicon.ico`. */
function originalHref(): string {
  const link = iconLinks().find((candidate) => candidate.getAttribute('href'));
  return link?.href ?? new URL('/favicon.ico', location.href).href;
}

/** Back in its old place (or at the end of `<head>` when that place is gone), last one first. */
function restore(placed: readonly Placed[]): void {
  for (const { link, parent, next } of [...placed].reverse()) {
    if (link.isConnected) continue;
    const into = parent?.isConnected ? parent : document.head;
    into?.insertBefore(link, next?.parentNode === into ? next : null);
  }
}

export function createFaviconTint(
  onSettled: (status: Settled) => void,
  timeoutMs: number,
): FaviconTint {
  let original: Promise<HTMLImageElement | undefined> | undefined;
  let ours: HTMLLinkElement | undefined;
  let taken: Placed[] = [];
  /** Bumped by every apply and remove, so only the latest load gets to draw. */
  let generation = 0;

  const show = (url: string) => {
    if (!ours) {
      taken = iconLinks().map((link) => ({
        link,
        parent: link.parentNode,
        next: link.nextSibling,
      }));
      for (const { link } of taken) link.remove();
      ours = document.createElement('link');
      ours.rel = 'icon';
      (document.head ?? document.documentElement).append(ours);
    }
    ours.href = url;
  };
  const remove = () => {
    generation++;
    original = undefined;
    ours?.remove();
    ours = undefined;
    restore(taken);
    taken = [];
  };
  const draw = (image: HTMLImageElement | undefined, color: string) => {
    const url = image && drawTinted(image, color);
    if (!url) {
      remove();
      return onSettled('unavailable');
    }
    show(url);
    onSettled('available');
  };

  return {
    apply(color) {
      const current = ++generation;
      if (!isHexColor(color)) return draw(undefined, color);
      original ??= loadImage(originalHref(), timeoutMs);
      void original.then((image) => {
        if (current === generation) draw(image, color);
      });
    },
    remove,
  };
}
