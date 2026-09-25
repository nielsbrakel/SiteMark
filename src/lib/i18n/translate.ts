/** Where messages come from: browser.i18n in the extension, JSON catalogs on the website (D-247). */
export type MessageSource = {
  /** BCP 47 locale used for plural rules and number formatting. */
  readonly locale: string;
  /** The formatted message, or undefined when the key has no message. */
  get(key: string, substitutions: readonly string[]): string | undefined;
};

/** Plural base keys: `files` for a catalog with `files_one`/`files_other`. */
export type PluralKey<K extends string> = K extends `${infer Base}_other` ? Base : never;

export type Translator<K extends string> = {
  t(key: K, substitutions?: string | readonly string[]): string;
  tp(key: PluralKey<K>, count: number, substitutions?: readonly string[]): string;
};

/**
 * The one translator shared by the extension and the website. Pure: no browser APIs, so the website
 * can import it (D-246). A missing message is a bug: it throws unless `onMissing: 'key'` (production).
 */
export function createTranslator<K extends string>(
  source: MessageSource,
  options: { onMissing?: 'throw' | 'key' } = {},
): Translator<K> {
  const t = (key: K, substitutions: string | readonly string[] = []): string => {
    const list = typeof substitutions === 'string' ? [substitutions] : substitutions;
    const message = source.get(key, list);
    if (message) return message;
    if (options.onMissing === 'key') return key;
    throw new Error(`Missing i18n message: ${key}`);
  };

  const tp = (key: PluralKey<K>, count: number, substitutions: readonly string[] = []): string => {
    const category = new Intl.PluralRules(source.locale).select(count);
    const list = [new Intl.NumberFormat(source.locale).format(count), ...substitutions];
    return source.get(`${key}_${category}`, list) ?? t(`${key}_other` as K, list);
  };

  return { t, tp };
}
