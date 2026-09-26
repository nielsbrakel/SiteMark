import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';

/** A policy file: its Markdown text and its path in the repository (for relative links). */
export type PolicySource = { source: string; file: string };

/** The privacy policy of a locale: PRIVACY.md or PRIVACY.nl.md, read at build time (D-249). */
export function policyFor(_locale: Locale): PolicySource {
  return notImplemented();
}
