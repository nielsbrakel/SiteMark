import { type Locale, websiteLocales } from '../i18n/locales';
import type { Route } from '../routes/routes';
import { type Alternate, absoluteUrl, alternates, canonicalUrl } from '../routes/urls';

/** A page's translated texts for its head. */
export type PageText = { title: string; description: string; imageAlt: string };

/** `<meta property>` (Open Graph) or `<meta name>` (Twitter) with its content. */
export type MetaTag = { key: string; content: string };

/** Everything search engines and link previews read from one route (REQ-SEO-001…004). */
export type SeoHead = {
  title: string;
  description: string;
  /** Absolute, with a trailing slash (REQ-SEO-002). */
  canonical: string;
  alternates: readonly Alternate[];
  /** `<meta property="og:…">`. */
  openGraph: readonly MetaTag[];
  /** `<meta name="twitter:…">`. */
  twitter: readonly MetaTag[];
};

const OG_LOCALES: Record<Locale, string> = { en: 'en_US', nl: 'nl_NL' };

/** design/social-preview.png, which the prerender step copies to the website root. */
const SOCIAL_PREVIEW = { file: 'social-preview.png', width: 1280, height: 640 } as const;

/** The absolute URL of the social preview image (Open Graph, Twitter and JSON-LD). */
export function socialPreviewUrl(): string {
  return absoluteUrl(SOCIAL_PREVIEW.file);
}

function openGraph(locale: Locale, canonical: string, text: PageText): MetaTag[] {
  const others = websiteLocales().filter((other) => other !== locale);
  return [
    { key: 'og:type', content: 'website' },
    { key: 'og:site_name', content: 'SiteMark' },
    { key: 'og:title', content: text.title },
    { key: 'og:description', content: text.description },
    { key: 'og:url', content: canonical },
    { key: 'og:locale', content: OG_LOCALES[locale] },
    ...others.map((other) => ({ key: 'og:locale:alternate', content: OG_LOCALES[other] })),
    { key: 'og:image', content: socialPreviewUrl() },
    { key: 'og:image:width', content: String(SOCIAL_PREVIEW.width) },
    { key: 'og:image:height', content: String(SOCIAL_PREVIEW.height) },
    { key: 'og:image:alt', content: text.imageAlt },
  ];
}

function twitter(text: PageText): MetaTag[] {
  return [
    { key: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', content: text.title },
    { key: 'twitter:description', content: text.description },
    { key: 'twitter:image', content: socialPreviewUrl() },
    { key: 'twitter:image:alt', content: text.imageAlt },
  ];
}

/** The head data of one route in one locale. Pure: no HTML, the Document renders it. */
export function seoHead(route: Pick<Route, 'slug'>, locale: Locale, text: PageText): SeoHead {
  const canonical = canonicalUrl(route, locale);
  return {
    title: text.title,
    description: text.description,
    canonical,
    alternates: alternates(route),
    openGraph: openGraph(locale, canonical, text),
    twitter: twitter(text),
  };
}
