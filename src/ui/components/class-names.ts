/** Joins CSS class names, skipping the empty ones. */
export function classNames(...names: readonly (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
