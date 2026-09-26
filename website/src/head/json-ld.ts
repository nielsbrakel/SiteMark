import { repositoryFileUrl } from '../config/repository';
import type { Locale } from '../i18n/locales';
import { socialPreviewUrl } from './seo';

type SoftwareApplicationInput = { locale: Locale; description: string; url: string };

/** The browsers with a store listing (Safari follows in v1.1, M9). */
const BROWSERS = ['Chrome', 'Edge', 'Firefox'];

/** schema.org SoftwareApplication data for the home routes (REQ-SEO-005). */
export function softwareApplication({
  locale,
  description,
  url,
}: SoftwareApplicationInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SiteMark',
    description,
    url,
    inLanguage: locale,
    applicationCategory: 'BrowserApplication',
    operatingSystem: BROWSERS.join(', '),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    license: repositoryFileUrl('LICENSE'),
    image: socialPreviewUrl(),
  };
}

/**
 * The JSON-LD text for a `<script type="application/ld+json">`. `<` is escaped as `<`, so no
 * value can end the script element or open a comment; JSON parsers read it back unchanged.
 */
export function jsonLdText(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
