import type { Locale } from '../i18n/locales';
import type { WebsiteTranslator } from '../i18n/website-t';
import type { Page } from '../pages/registry';
import type { Route } from '../routes/routes';
import { jsonLdText, softwareApplication } from './json-ld';
import { type SeoHead, seoHead } from './seo';

export type PageHead = { head: SeoHead; jsonLd: string | undefined };

/** The head of one page in one locale: SEO tags from its catalog texts, JSON-LD on home only. */
export function pageHead(
  route: Route,
  page: Page,
  locale: Locale,
  t: WebsiteTranslator['t'],
): PageHead {
  const head = seoHead(route, locale, {
    title: t(page.title),
    description: t(page.description),
    imageAlt: t('websiteSocialImageAlt'),
  });
  const jsonLd =
    route.page === 'home'
      ? jsonLdText(
          softwareApplication({ locale, description: head.description, url: head.canonical }),
        )
      : undefined;
  return { head, jsonLd };
}
