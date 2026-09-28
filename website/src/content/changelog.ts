// CHANGELOG.md (Changesets, REQ-PAGE-005), read by the SSR build. It doesn't exist until the first
// release, so it is globbed: a missing file is an empty changelog, not a build error.
const FILES = import.meta.glob<string>('../../../CHANGELOG.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The Markdown of CHANGELOG.md, or undefined before the first release. */
export function changelogSource(): string | undefined {
  return Object.values(FILES)[0];
}

/** The release notes without the package heading (`# sitemark`): the page has its own h1. */
export function changelogBody(source: string): string {
  return source.replace(/^# .*\n+/, '');
}

/** The release headings (`## 1.0.0`), newest first as Changesets writes them. */
export function changelogReleases(source: string | undefined): string[] {
  return [...(source ?? '').matchAll(/^## (.+)$/gm)].map((match) => (match[1] ?? '').trim());
}
