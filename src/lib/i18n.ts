import { browser } from 'wxt/browser';

export type MessageKey =
  | 'extName'
  | 'extDescription'
  | 'commandStartPicker'
  | 'popupTitle'
  | 'optionsTitle'
  | 'scaffoldNotice';

/** Thin wrapper over browser.i18n so components stay easy to mock in tests. */
export function t(key: MessageKey, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions) || key;
}
