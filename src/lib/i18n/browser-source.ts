import { browser } from 'wxt/browser';
import type { Language } from '@/core/model/schema';
import { notImplemented } from '@/core/not-implemented';
import type { MessageKey } from './message-key';
import { createTranslator, type MessageSource } from './translate';

export type { MessageKey };

/** The browser.i18n adapter (extension only; the website uses a catalog source). */
export const browserSource: MessageSource = {
  get locale() {
    return browser.i18n.getUILanguage();
  },
  // The port is string-based (shared with the website); unknown keys come back empty → undefined.
  get: (key, substitutions) =>
    browser.i18n.getMessage(key as MessageKey, [...substitutions]) || undefined,
};

const translator = createTranslator<MessageKey>(browserSource, {
  onMissing: import.meta.env.PROD ? 'key' : 'throw',
});

export const { t, tp } = translator;

/** Sets `lang` and `dir` on <html> from the resolved UI locale (REQ-I18N-004). */
export function applyDocumentLocale(doc: Document): void {
  doc.documentElement.lang = browser.i18n.getUILanguage();
  doc.documentElement.dir = browser.i18n.getMessage('@@bidi_dir') === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Reads `language` from the bundled catalogs instead of browser.i18n (REQ-I18N-006); `auto` and
 * `undefined` (not loaded yet) go back to the browser language.
 */
export async function applyLanguage(_language: Language | undefined): Promise<void> {
  return notImplemented();
}
