import { notImplemented } from '@/core/not-implemented';

/** The website languages (D-255): English at the base path, Dutch under /nl/. */
export type Locale = 'en' | 'nl';

/** Every website locale; the first one is the default. */
export function websiteLocales(): readonly Locale[] {
  return notImplemented();
}
