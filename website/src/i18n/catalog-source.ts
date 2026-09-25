import type { MessageSource } from '@/lib/i18n/translate';

/** One message in the `chrome.i18n` messages.json format (D-247). */
export type CatalogEntry = {
  readonly message: string;
  readonly description?: string;
  readonly placeholders?: Readonly<Record<string, { readonly content: string }>>;
};

export type Catalog = Readonly<Record<string, CatalogEntry>>;

/** Keys that more than one catalog defines (a bug: keys are never duplicated, D-247). */
export function duplicateKeys(catalogs: readonly Catalog[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of catalogs.flatMap((catalog) => Object.keys(catalog))) {
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

/** `$1`…`$9` → substitutions and `$$` → `$`, as chrome.i18n does. */
function positional(text: string, substitutions: readonly string[]): string {
  return text.replace(/\$(\$|\d)/g, (match, token: string) =>
    token === '$' ? '$' : (substitutions[Number(token) - 1] ?? match),
  );
}

/** One pass, so a substituted value is never formatted again. */
function format(entry: CatalogEntry, substitutions: readonly string[]): string {
  const placeholders = new Map(
    Object.entries(entry.placeholders ?? {}).map(([name, { content }]) => [
      name.toLowerCase(),
      content,
    ]),
  );
  return entry.message.replace(/\$([a-z0-9_@]+)\$|\$(?:\$|\d)/gi, (match, name?: string) => {
    const content = name === undefined ? match : placeholders.get(name.toLowerCase());
    return content === undefined ? match : positional(content, substitutions);
  });
}

/**
 * A MessageSource over the merged catalogs, formatting like chrome.i18n: `$NAME$` placeholders
 * first, then `$1`…`$9` substitutions. Throws when two catalogs define the same key.
 */
export function createCatalogSource(locale: string, catalogs: readonly Catalog[]): MessageSource {
  const duplicates = duplicateKeys(catalogs);
  if (duplicates.length) {
    throw new Error(`i18n keys defined in more than one catalog: ${duplicates.join(', ')}`);
  }
  const messages = new Map(catalogs.flatMap((catalog) => Object.entries(catalog)));
  return {
    locale,
    get: (key, substitutions) => {
      const entry = messages.get(key);
      return entry && format(entry, substitutions);
    },
  };
}
