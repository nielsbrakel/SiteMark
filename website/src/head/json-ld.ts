import { repositoryFileUrl, repositoryUrl } from '../config/repository';
import { stores } from '../config/stores';
import { playgroundPreviewFile } from '../content/playground-preview';
import type { Locale } from '../i18n/locales';
import { absoluteUrl } from '../routes/urls';
import { socialPreviewUrl } from './seo';

type SoftwareApplicationInput = {
  locale: Locale;
  description: string;
  url: string;
  /** The descriptive store name, e.g. "SiteMark – Environment Indicator" (D-300). */
  alternateName: string;
};

const OPERATING_SYSTEMS = ['Windows', 'macOS', 'Linux', 'ChromeOS'];

/** The browser versions of REQ-NFR-001 (wxt.config.ts), without Safari until it ships. */
const BROWSER_REQUIREMENTS = 'Requires Chrome 120+, Edge 120+ or Firefox 140+';

const FEATURES = [
  'Corner ribbons, banners, frames, tints, stripes and watermarks',
  'Mark a single element you pick, such as a Delete button',
  'Tab title prefix and favicon dot',
  'No accounts, no analytics and no access to websites at install',
];

/** schema.org SoftwareApplication data for the home routes (REQ-SEO-005). */
export function softwareApplication({
  locale,
  description,
  url,
  alternateName,
}: SoftwareApplicationInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SiteMark',
    alternateName,
    description,
    url,
    inLanguage: locale,
    applicationCategory: 'BrowserApplication',
    operatingSystem: OPERATING_SYSTEMS.join(', '),
    browserRequirements: BROWSER_REQUIREMENTS,
    featureList: FEATURES,
    author: { '@type': 'Person', name: 'Niels van Brakel', url: 'https://github.com/nielsbrakel' },
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    installUrl: stores().flatMap(({ url }) => (url ? [url] : [])),
    screenshot: absoluteUrl(playgroundPreviewFile('light', locale, 'png')),
    codeRepository: repositoryUrl(),
    license: repositoryFileUrl('LICENSE'),
    image: socialPreviewUrl(locale),
  };
}

/**
 * The JSON-LD text for a `<script type="application/ld+json">`. `<` is escaped as `<`, so no
 * value can end the script element or open a comment; JSON parsers read it back unchanged.
 */
export function jsonLdText(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
