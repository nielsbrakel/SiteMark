import { renderToString } from 'react-dom/server';
import { Document } from './document/Document';
import type { Locale } from './i18n/locales';
import { websiteLocales } from './i18n/locales';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from './i18n/website-t';
import { PageView } from './pages/PageView';
import { pageFor, renderedRoutes } from './pages/registry';
import type { Route } from './routes/routes';
import { assetUrl, outputFile } from './routes/urls';

/** Built client files, relative to the client output directory (from the Vite manifest). */
export type PageAssets = { script: string; styles: readonly string[] };

/** One prerendered HTML file, relative to the client output directory. */
export type RenderedPage = { file: string; html: string };

function renderRoute(
  route: Route,
  locale: Locale,
  translator: WebsiteTranslator,
  assets: PageAssets,
): RenderedPage[] {
  const page = pageFor(route.page);
  if (!page) return [];
  const html = renderToString(
    <Document
      locale={locale}
      page={route.page}
      title={translator.t(page.title)}
      script={assetUrl(assets.script)}
      styles={assets.styles.map(assetUrl)}
    >
      <PageView
        route={route}
        page={page}
        locale={locale}
        routes={renderedRoutes()}
        translator={translator}
      />
    </Document>,
  );
  return [{ file: outputFile(route, locale), html: `<!doctype html>${html}` }];
}

/** Every published route that has a page, in every locale, as a complete HTML document. */
export async function renderPages(assets: PageAssets): Promise<RenderedPage[]> {
  const routes = renderedRoutes();
  const perLocale = await Promise.all(
    websiteLocales().map(async (locale) => {
      const translator = createWebsiteTranslator(locale, await loadCatalogs(locale));
      return routes.flatMap((route) => renderRoute(route, locale, translator, assets));
    }),
  );
  return perLocale.flat();
}
