import en from '../../../PRIVACY.md?raw';
import nl from '../../../PRIVACY.nl.md?raw';
import type { Locale } from '../i18n/locales';

/** A policy file: its Markdown text and its path in the repository (for relative links). */
export type PolicySource = { source: string; file: string };

// Read by the SSR build (the pages are prerendered); no page code, so no policy, reaches the browser.
const POLICIES: Record<Locale, PolicySource> = {
  en: { source: en, file: 'PRIVACY.md' },
  nl: { source: nl, file: 'PRIVACY.nl.md' },
};

/** The privacy policy of a locale: PRIVACY.md or PRIVACY.nl.md, the only copy (D-249). */
export function policyFor(locale: Locale): PolicySource {
  return POLICIES[locale];
}
