import { cssAttrValue, cssEscapeIdent, isStableToken } from '../../core/selector-tokens';

// The picker's selector generator (REQ-PICK-004). It tries the element's own hooks in order of
// preference (a stable id, test ids, aria-label, name, role, hand-written classes) and falls back
// to an `:nth-of-type` path, anchored at the nearest ancestor that has such a hook, or else the
// shortest path that works. A candidate
// only counts when the element is its FIRST match in the document, because that is how the marker
// resolves a selector (REQ-RND-005). Generated tokens are skipped by core's isStableToken.

const MAX_LENGTH = 300;

/** Test hooks that teams add for exactly this purpose: stable across deploys. */
const TEST_ATTRIBUTES = ['data-testid', 'data-test', 'data-qa', 'data-cy'] as const;
/** Less stable than test ids, still better than classes (in this order). */
const LABEL_ATTRIBUTES = ['aria-label', 'name', 'role'] as const;

type Resolves = (selector: string) => boolean;

function tagOf(element: Element): string {
  return cssEscapeIdent(element.localName);
}

function idSelectors(element: Element): string[] {
  const { id } = element;
  return id && isStableToken(id) ? [`#${cssEscapeIdent(id)}`] : [];
}

function attributeSelectors(element: Element, names: readonly string[]): string[] {
  return names.flatMap((name) => {
    const value = element.getAttribute(name);
    if (!value?.trim()) return [];
    const attribute = `[${name}=${cssAttrValue(value)}]`;
    return [attribute, `${tagOf(element)}${attribute}`];
  });
}

/** Each stable class on its own, then all of them together. */
function classSelectors(element: Element): string[] {
  const classes = [...element.classList]
    .filter(isStableToken)
    .map((name) => `.${cssEscapeIdent(name)}`);
  const tag = tagOf(element);
  const single = classes.map((name) => `${tag}${name}`);
  return classes.length > 1 ? [...single, `${tag}${classes.join('')}`] : single;
}

/** The element's own hooks, most stable first. */
function ownSelectors(element: Element): string[] {
  return [
    ...idSelectors(element),
    ...attributeSelectors(element, TEST_ATTRIBUTES),
    ...attributeSelectors(element, LABEL_ATTRIBUTES),
    ...classSelectors(element),
  ];
}

/** `tag`, or `tag:nth-of-type(n)` when the parent has more children of that type. */
function pathStep(element: Element): string {
  const tag = tagOf(element);
  const parent = element.parentElement;
  if (!parent) return tag;
  const sameType = [...parent.children].filter(
    (sibling) => sibling.localName === element.localName,
  );
  return sameType.length > 1 ? `${tag}:nth-of-type(${sameType.indexOf(element) + 1})` : tag;
}

/**
 * The `>` path from the nearest ancestor with a hook of its own (`#orders > tbody > tr > td`),
 * which survives changes elsewhere in the page.
 */
function anchoredPath(element: Element, resolves: Resolves): string | undefined {
  let path = pathStep(element);
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const anchor = ownSelectors(parent).find(resolvesTo(parent));
    if (anchor) return resolves(`${anchor} > ${path}`) ? `${anchor} > ${path}` : undefined;
    path = `${pathStep(parent)} > ${path}`;
    if (path.length > MAX_LENGTH) return undefined;
  }
  return undefined;
}

/** The shortest `>` path, walking up from the element, whose first match is the element. */
function shortestPath(element: Element, resolves: Resolves): string | undefined {
  let path = '';
  for (let node: Element | null = element; node; node = node.parentElement) {
    path = path ? `${pathStep(node)} > ${path}` : pathStep(node);
    if (path.length > MAX_LENGTH) return undefined;
    if (resolves(path)) return path;
  }
  return undefined;
}

function resolvesTo(element: Element): Resolves {
  return (selector) => {
    if (selector.length > MAX_LENGTH) return false;
    try {
      return element.ownerDocument.querySelector(selector) === element;
    } catch {
      return false;
    }
  };
}

/**
 * A CSS selector whose first match in the element's document is `element` (REQ-PICK-004), at most
 * 300 characters, or `undefined` when no such selector exists.
 */
export function generateSelector(element: Element): string | undefined {
  const resolves = resolvesTo(element);
  return (
    ownSelectors(element).find(resolves) ??
    anchoredPath(element, resolves) ??
    shortestPath(element, resolves)
  );
}
