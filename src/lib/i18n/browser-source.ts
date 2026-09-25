import { notImplemented } from '@/core/not-implemented';
import type en from '../../../public/_locales/en/messages.json';
import type { MessageSource, PluralKey } from './translate';

/** Every key in public/_locales/en/messages.json. A typo is a type error. */
export type MessageKey = keyof typeof en;

/** The browser.i18n adapter (extension only; the website uses a catalog source). */
export const browserSource: MessageSource = {
  get locale(): string {
    return notImplemented();
  },
  get: () => notImplemented(),
};

export function t(_key: MessageKey, _substitutions?: string | readonly string[]): string {
  return notImplemented();
}

export function tp(_key: PluralKey<MessageKey>, _count: number): string {
  return notImplemented();
}

/** Sets `lang` and `dir` on <html> from the resolved UI locale (REQ-I18N-004). */
export function applyDocumentLocale(_doc: Document): void {
  notImplemented();
}
