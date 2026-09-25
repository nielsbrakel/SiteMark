import { browser } from 'wxt/browser';
import { notImplemented } from '@/core/not-implemented';
import type en from '../../public/_locales/en/messages.json';

/** Every key in public/_locales/en/messages.json. A typo is a type error. */
export type MessageKey = keyof typeof en;

/** Keys with `_one`/`_other` variants, used through tp(). */
export type PluralKey = MessageKey extends infer K
  ? K extends `${infer Base}_other`
    ? Base
    : never
  : never;

/** Thin wrapper over browser.i18n so components stay easy to test. */
export function t(key: MessageKey, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions) || key;
}

/** Plural-aware message: picks `<key>_<category>` with Intl.PluralRules; the count is `$1`. */
export function tp(_key: PluralKey, _count: number): string {
  return notImplemented();
}

/** Sets `lang` and `dir` on <html> from the resolved UI locale (REQ-I18N-004). */
export function applyDocumentLocale(_doc: Document): void {
  notImplemented();
}
