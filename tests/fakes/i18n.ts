import en from '../../public/_locales/en/messages.json';

export type Messages = Record<
  string,
  { message: string; description?: string; placeholders?: Record<string, { content: string }> }
>;

export type FakeI18nApi = {
  getMessage(key: string, substitutions?: string | string[]): string;
  getUILanguage(): string;
};

/** Chrome's rules: `$name$` placeholders (case-insensitive) first, then `$1`…`$9`. */
function format(entry: Messages[string], substitutions: string[]): string {
  const positional = (text: string) =>
    text.replace(/\$(\d)/g, (match, n: string) => substitutions[Number(n) - 1] ?? match);
  const placeholders = Object.fromEntries(
    Object.entries(entry.placeholders ?? {}).map(([name, { content }]) => [
      name.toLowerCase(),
      content,
    ]),
  );
  const named = entry.message.replace(/\$([a-z0-9_@]+)\$/gi, (match, name: string) => {
    const content = placeholders[name.toLowerCase()];
    return content === undefined ? match : positional(content);
  });
  return positional(named);
}

export function createFakeI18n(messages: Messages = en, uiLanguage = 'en'): { api: FakeI18nApi } {
  return {
    api: {
      getMessage: (key, substitutions = []) => {
        const entry = messages[key];
        if (!entry) throw new Error(`Unknown i18n key: ${key}`);
        return format(entry, typeof substitutions === 'string' ? [substitutions] : substitutions);
      },
      getUILanguage: () => uiLanguage,
    },
  };
}
