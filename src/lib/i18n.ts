import { browser } from 'wxt/browser';
import type en from '../../public/_locales/en/messages.json';

/** Every key in public/_locales/en/messages.json. A typo is a type error. */
export type MessageKey = keyof typeof en;

/** Keys with `_one`/`_other` variants, used through tp(). */
export type PluralKey = MessageKey extends infer K
  ? K extends `${infer Base}_other`
    ? Base
    : never
  : never;

/**
 * Thin wrapper over browser.i18n so components stay easy to test. A missing message is a bug:
 * it throws in dev and tests, and falls back to the key in production builds.
 */
export function t(key: MessageKey, substitutions?: string | string[]): string {
  const message = browser.i18n.getMessage(key, substitutions);
  if (message) return message;
  if (import.meta.env.PROD) return key;
  throw new Error(`Missing i18n message: ${key}`);
}

/** Plural-aware message: picks `<key>_<category>` with Intl.PluralRules; the count is `$1`. */
export function tp(key: PluralKey, count: number): string {
  const locale = browser.i18n.getUILanguage();
  const category = new Intl.PluralRules(locale).select(count);
  const variant = `${key}_${category}` as MessageKey;
  const formatted = new Intl.NumberFormat(locale).format(count);
  const message = browser.i18n.getMessage(variant, formatted);
  return message || t(`${key}_other` as MessageKey, formatted);
}

/** Sets `lang` and `dir` on <html> from the resolved UI locale (REQ-I18N-004). */
export function applyDocumentLocale(doc: Document): void {
  doc.documentElement.lang = browser.i18n.getUILanguage();
  doc.documentElement.dir = browser.i18n.getMessage('@@bidi_dir') === 'rtl' ? 'rtl' : 'ltr';
}
