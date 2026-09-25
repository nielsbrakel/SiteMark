/** The public repository: contact goes through GitHub only (D-248). */
const REPOSITORY = 'https://github.com/nielsbrakel/SiteMark';

export function repositoryUrl(): string {
  return REPOSITORY;
}

/** A file in the repository on the default branch, e.g. `LICENSE` or `.github/SUPPORT.md`. */
export function repositoryFileUrl(file: string): string {
  return `${REPOSITORY}/blob/main/${file.replace(/^\/+/, '')}`;
}
