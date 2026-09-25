import { notImplemented } from '@/core/not-implemented';
import en from '../../public/_locales/en/messages.json';

export type Messages = Record<
  string,
  { message: string; description?: string; placeholders?: Record<string, { content: string }> }
>;

export type FakeI18nApi = {
  getMessage(key: string, substitutions?: string | string[]): string;
  getUILanguage(): string;
};

export function createFakeI18n(_messages: Messages = en, _uiLanguage = 'en'): { api: FakeI18nApi } {
  return notImplemented();
}
