import { type HydrationOptions, hydrateRoot, type Root } from 'react-dom/client';
import { isLocale } from './i18n/locales';
import { createWebsiteTranslator, loadCatalogs } from './i18n/website-t';
import { pageFor } from './pages/registry';

/**
 * Hydrates the page that `<html data-route data-locale>` names, with the catalogs of that locale.
 * Resolves to undefined when the document names no known page (nothing to hydrate).
 */
export async function hydratePage(
  doc: Document,
  options: HydrationOptions = {},
): Promise<Root | undefined> {
  const { route = '', locale } = doc.documentElement.dataset;
  const page = pageFor(route);
  const container = doc.getElementById('root');
  if (!page || !isLocale(locale) || !container) return undefined;
  const { t, tp } = createWebsiteTranslator(locale, await loadCatalogs(locale));
  return hydrateRoot(container, <page.Component t={t} tp={tp} />, options);
}
