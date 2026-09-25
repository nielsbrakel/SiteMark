import { browser } from 'wxt/browser';
import type en from '../../../public/_locales/en/messages.json';
import { createTranslator, type MessageSource } from './translate';

/** Every key in public/_locales/en/messages.json. A typo is a type error. */
export type MessageKey = keyof typeof en;

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
