/** The website languages (D-255): English at the base path, Dutch under /nl/. */
export type Locale = 'en' | 'nl';

const LOCALES: readonly Locale[] = ['en', 'nl'];

/** Every website locale; the first one is the default. */
export function websiteLocales(): readonly Locale[] {
  return LOCALES;
}

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
