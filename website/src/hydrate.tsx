import type { HydrationOptions, Root } from 'react-dom/client';
import { notImplemented } from '@/core/not-implemented';

/**
 * Hydrates the page that `<html data-route data-locale>` names, with the catalogs of that locale.
 * Resolves to undefined when the document names no known page (nothing to hydrate).
 */
export function hydratePage(
  _doc: Document,
  _options: HydrationOptions = {},
): Promise<Root | undefined> {
  return notImplemented();
}
