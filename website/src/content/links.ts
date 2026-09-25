import { repositoryFileUrl } from '../config/repository';

export type ResolvedLink = { href: string; external: boolean };

const SCHEME = /^[a-z][a-z0-9+.-]*:|^\/\//i;

/** `a/b/../c/./d` → `c/d`; `..` above the repository root stays at the root. */
function normalize(segments: readonly string[]): string {
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === '..') out.pop();
    else if (segment && segment !== '.') out.push(segment);
  }
  return out.join('/');
}

/**
 * Where a Markdown link goes. `#section` stays on the page; a URL with a scheme leaves the website
 * as it is; anything else is a path in the repository, relative to the Markdown `file` (or to the
 * repository root when it starts with `/`), and becomes its GitHub URL.
 */
export function resolveLink(href: string, file: string): ResolvedLink {
  if (href.startsWith('#')) return { href, external: false };
  if (SCHEME.test(href)) return { href, external: true };
  const [, path = '', suffix = ''] = href.match(/^([^?#]*)(.*)$/) ?? [];
  const folder = path.startsWith('/') ? [] : file.split('/').slice(0, -1);
  const target = normalize([...folder, ...path.split('/')]);
  return { href: `${repositoryFileUrl(target)}${suffix}`, external: true };
}
