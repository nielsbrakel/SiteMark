// The live-region text for a candidate (REQ-A11Y-011): "button, Delete, 120 by 36". A small
// approximation of the accessible role and name: enough to tell candidates apart by ear.

const NAME_MAX = 60;

const IMPLICIT_ROLES: Readonly<Record<string, string>> = {
  button: 'button',
  select: 'combobox',
  textarea: 'textbox',
  img: 'img',
  nav: 'navigation',
  main: 'main',
  aside: 'complementary',
  header: 'banner',
  footer: 'contentinfo',
  form: 'form',
  table: 'table',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  dialog: 'dialog',
  article: 'article',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

const INPUT_ROLES: Readonly<Record<string, string>> = {
  checkbox: 'checkbox',
  radio: 'radio',
  button: 'button',
  submit: 'button',
  reset: 'button',
  image: 'button',
  range: 'slider',
  search: 'searchbox',
};

/** Roles whose name may come from their text (ARIA "name from content"). */
const NAMED_BY_CONTENT = new Set(['button', 'link', 'heading', 'listitem', 'checkbox', 'radio']);

function lookup(table: Readonly<Record<string, string>>, key: string): string | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/** The explicit role, the implicit one, or else the tag name. */
export function roleOf(element: Element): string {
  const explicit = element.getAttribute('role')?.trim().split(/\s+/)[0];
  if (explicit) return explicit;
  const tag = element.localName;
  if (tag === 'a' && element.hasAttribute('href')) return 'link';
  if (tag === 'input') return lookup(INPUT_ROLES, element.getAttribute('type') ?? '') ?? 'textbox';
  return lookup(IMPLICIT_ROLES, tag) ?? tag;
}

function clean(text: string | null | undefined): string {
  const collapsed = (text ?? '').replace(/\s+/g, ' ').trim();
  return collapsed.length > NAME_MAX ? `${collapsed.slice(0, NAME_MAX - 1)}…` : collapsed;
}

function labelledBy(element: Element): string {
  const ids = element.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
  return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
}

/** aria-label, aria-labelledby, alt, title or placeholder; the text for buttons, links… */
export function nameOf(element: Element, role: string): string {
  const attribute = (name: string) => element.getAttribute(name);
  const named =
    clean(attribute('aria-label')) ||
    clean(labelledBy(element)) ||
    clean(attribute('alt') ?? attribute('title') ?? attribute('placeholder'));
  if (named) return named;
  return NAMED_BY_CONTENT.has(role) ? clean(element.textContent) : '';
}

/** Role, name, size and the frame/component note, whichever apply, separated by commas. */
export function announcement(element: Element, size: string, note: string | undefined): string {
  const role = roleOf(element);
  return [role, nameOf(element, role), size, note].filter(Boolean).join(', ');
}
