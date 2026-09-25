import { notImplemented } from '@/core/not-implemented';
import type { MessageSource } from '@/lib/i18n/translate';

/** One message in the `chrome.i18n` messages.json format (D-247). */
export type CatalogEntry = {
  readonly message: string;
  readonly description?: string;
  readonly placeholders?: Readonly<Record<string, { readonly content: string }>>;
};

export type Catalog = Readonly<Record<string, CatalogEntry>>;

/** Keys that more than one catalog defines (a bug: keys are never duplicated, D-247). */
export function duplicateKeys(_catalogs: readonly Catalog[]): string[] {
  return notImplemented();
}

/**
 * A MessageSource over the merged catalogs, formatting like chrome.i18n: `$NAME$` placeholders
 * first, then `$1`…`$9` substitutions. Throws when two catalogs define the same key.
 */
export function createCatalogSource(_locale: string, _catalogs: readonly Catalog[]): MessageSource {
  return notImplemented();
}
