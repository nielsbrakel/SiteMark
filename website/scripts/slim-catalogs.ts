import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { SHARED_MESSAGE_KEYS } from '../src/i18n/shared-keys.ts';

type Entry = {
  readonly message: string;
  readonly description?: string;
  readonly placeholders?: Record<string, { readonly content: string; readonly example?: string }>;
};

const CATALOG = /[/\\](?:public[/\\]_locales|locales)[/\\][a-z]{2}[/\\]messages\.json$/;
const EXTENSION_CATALOG = /[/\\]public[/\\]_locales[/\\]/;

/**
 * What a translator needs at runtime: the message and the placeholders' content. Descriptions and
 * examples are notes for translators, and would double the size of every language chunk
 * (REQ-WEB-007).
 */
export function slimCatalog(
  catalog: Readonly<Record<string, Entry>>,
  keep: (key: string) => boolean = () => true,
): Record<string, Entry> {
  return Object.fromEntries(
    Object.entries(catalog)
      .filter(([key]) => keep(key))
      .map(([key, { message, placeholders }]) => [
        key,
        placeholders
          ? {
              message,
              placeholders: Object.fromEntries(
                Object.entries(placeholders).map(([name, { content }]) => [name, { content }]),
              ),
            }
          : { message },
      ]),
  );
}

const shared = new Set<string>(SHARED_MESSAGE_KEYS);

/**
 * Loads the website's and the extension's messages.json files slimmed down (see `slimCatalog`); of
 * the extension's catalog only the keys the website shows (SHARED_MESSAGE_KEYS).
 */
export function slimCatalogs(): Plugin {
  return {
    name: 'sitemark-website-slim-catalogs',
    enforce: 'pre',
    load(id) {
      if (!CATALOG.test(id)) return undefined;
      const catalog = JSON.parse(readFileSync(id, 'utf8')) as Record<string, Entry>;
      // Still JSON: Vite's own JSON plugin turns it into a module afterwards.
      const keep = EXTENSION_CATALOG.test(id) ? (key: string) => shared.has(key) : undefined;
      return JSON.stringify(slimCatalog(catalog, keep));
    },
  };
}
