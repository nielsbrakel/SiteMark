import { notImplemented } from '@/core/not-implemented';

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

export function createTranslator<K extends string>(
  _source: MessageSource,
  _options: { onMissing?: 'throw' | 'key' } = {},
): Translator<K> {
  return notImplemented();
}
