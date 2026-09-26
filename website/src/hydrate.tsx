import { type HydrationOptions, hydrateRoot, type Root } from 'react-dom/client';
import { isLocale } from './i18n/locales';
import { createWebsiteTranslator, loadCatalogs } from './i18n/website-t';
import { islandFor } from './islands/islands';

/**
 * Hydrates every `[data-island]` of the prerendered page, with the catalogs of `<html data-locale>`:
 * only the interactive parts. The rest of the page is static HTML that needs no JavaScript, so the
 * browser never loads the page content's code (REQ-WEB-002, REQ-WEB-007). Resolves to the roots.
 */
export async function hydrateIslands(
  doc: Document,
  options: HydrationOptions = {},
): Promise<Root[]> {
  const { locale } = doc.documentElement.dataset;
  const hosts = [...doc.querySelectorAll<HTMLElement>('[data-island]')];
  if (!isLocale(locale) || !hosts.length) return [];
  const { t } = createWebsiteTranslator(locale, await loadCatalogs(locale));
  return hosts.flatMap((host) => {
    const Component = islandFor(host.dataset.island ?? '');
    return Component ? [hydrateRoot(host, <Component t={t} />, options)] : [];
  });
}
