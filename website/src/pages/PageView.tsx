import { Shell } from '../components/Shell';
import type { Locale } from '../i18n/locales';
import type { WebsiteTranslator } from '../i18n/website-t';
import type { Route } from '../routes/routes';
import type { Page } from './registry';

type PageViewProps = {
  route: Route;
  page: Page;
  locale: Locale;
  routes: readonly Route[];
  translator: WebsiteTranslator;
};

/** Everything inside #root: the shell around the page. The server and the browser render the same. */
export function PageView({ route, page, locale, routes, translator }: PageViewProps) {
  return (
    <Shell route={route} locale={locale} routes={routes} t={translator.t}>
      <page.Component t={translator.t} tp={translator.tp} />
    </Shell>
  );
}
