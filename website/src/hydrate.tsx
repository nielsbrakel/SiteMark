import { type HydrationOptions, hydrateRoot, type Root } from 'react-dom/client';
import { isLocale } from './i18n/locales';
import { createWebsiteTranslator, loadCatalogs } from './i18n/website-t';
import { loadIsland } from './islands/island-loaders';
import type { IslandComponent } from './islands/islands';

type Found = { host: HTMLElement; Component: IslandComponent };

/** The islands of the page with their components (a playground loads its own chunk first). */
async function islandsOf(hosts: readonly HTMLElement[]): Promise<Found[]> {
  const found = await Promise.all(
    hosts.map(async (host) => {
      const Component = await loadIsland(host.dataset.island ?? '');
      return Component ? [{ host, Component }] : [];
    }),
  );
  return found.flat();
}

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
  const [catalogs, islands] = await Promise.all([loadCatalogs(locale), islandsOf(hosts)]);
  const { t } = createWebsiteTranslator(locale, catalogs);
  return islands.map(({ host, Component }) => hydrateRoot(host, <Component t={t} />, options));
}
