import { type HydrationOptions, hydrateRoot, type Root } from 'react-dom/client';
import { notImplemented } from '@/core/not-implemented';
import { isLocale } from './i18n/locales';
import { createWebsiteTranslator, loadCatalogs } from './i18n/website-t';
import { PageView } from './pages/PageView';
import { pageFor, renderedRoutes } from './pages/registry';

/**
 * Hydrates the page that `<html data-route data-locale>` names, with the catalogs of that locale.
 * Resolves to undefined when the document names no known page (nothing to hydrate).
 */
export async function hydratePage(
  doc: Document,
  options: HydrationOptions = {},
): Promise<Root | undefined> {
  const { route: pageId = '', locale } = doc.documentElement.dataset;
  const routes = renderedRoutes();
  const route = routes.find((r) => r.page === pageId);
  const page = pageFor(pageId);
  const container = doc.getElementById('root');
  if (!route || !page || !isLocale(locale) || !container) return undefined;
  const translator = createWebsiteTranslator(locale, await loadCatalogs(locale));
  return hydrateRoot(
    container,
    <PageView route={route} page={page} locale={locale} routes={routes} translator={translator} />,
    options,
  );
}

/**
 * Hydrates every `[data-island]` of the prerendered page: only the interactive parts. The rest of
 * the page is static HTML that needs no JavaScript.
 */
export function hydrateIslands(_doc: Document, _options: HydrationOptions = {}): Promise<Root[]> {
  return notImplemented();
}
