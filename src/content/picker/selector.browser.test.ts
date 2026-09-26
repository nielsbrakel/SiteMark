import fc from 'fast-check';
import { afterEach, describe, expect, it } from 'vitest';
import { assertProperty } from '../../core/testing/property';
import { generateSelector } from './selector';

type Attrs = Readonly<Record<string, string>>;

const fixtures: Element[] = [];

afterEach(() => {
  for (const node of fixtures.splice(0)) node.remove();
});

/** Builds an element with attributes and children (no HTML parsing). */
function el(tag: string, attrs: Attrs = {}, children: readonly Element[] = []): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

/** Mounts a fixture in the page; it is removed after the test. */
function mount(...elements: Element[]): void {
  const root = el('div', {}, elements);
  document.body.append(root);
  fixtures.push(root);
}

/** The selector for `element`, checked to resolve (first match) to it and to fit 300 characters. */
function selectorOf(element: Element): string {
  const selector = generateSelector(element);
  expect(selector).toBeDefined();
  expect(document.querySelector(selector as string)).toBe(element);
  expect((selector as string).length).toBeLessThanOrEqual(300);
  return selector as string;
}

describe('REQ-PICK-004 selector generation follows the priority order', () => {
  it('prefers a stable id', () => {
    const button = el('button', { id: 'delete', 'data-testid': 'delete-customer', class: 'btn' });
    mount(button);
    expect(selectorOf(button)).toBe('#delete');
  });

  it.each(['data-testid', 'data-test', 'data-qa', 'data-cy'])('uses %s next', (attribute) => {
    const button = el('button', { id: 'ember1234', [attribute]: 'save', 'aria-label': 'Save' });
    mount(button);
    expect(selectorOf(button)).toBe(`[${attribute}="save"]`);
  });

  it('uses aria-label before name, role and classes', () => {
    const input = el('input', { 'aria-label': 'Search', name: 'q', role: 'searchbox', class: 'x' });
    mount(input);
    expect(selectorOf(input)).toBe('[aria-label="Search"]');
  });

  it('uses name before role and classes', () => {
    const input = el('input', { name: 'email', role: 'textbox', class: 'field' });
    mount(input);
    expect(selectorOf(input)).toBe('[name="email"]');
  });

  it('uses role before classes', () => {
    const list = el('div', { role: 'tablist', class: 'tabs' });
    mount(list);
    expect(selectorOf(list)).toBe('[role="tablist"]');
  });

  it('uses non-hashed classes and skips generated ones', () => {
    const button = el('button', { class: 'css-1x2y3z btn-danger sc-bdVaJa' });
    mount(button);
    expect(selectorOf(button)).toBe('button.btn-danger');
  });

  it('skips a generated id', () => {
    const button = el('button', { id: 'ember1234', class: 'primary-action' });
    mount(button);
    expect(selectorOf(button)).not.toContain('ember1234');
  });

  it('falls back to an :nth-of-type path', () => {
    const cells = [el('span'), el('span'), el('span')];
    mount(el('section', {}, [el('div', {}, cells)]));
    const selector = selectorOf(cells[1] as Element);
    expect(selector).toContain(':nth-of-type(2)');
  });

  it('anchors the path at an ancestor with a stable id', () => {
    const cell = el('td');
    mount(el('table', { id: 'orders' }, [el('tbody', {}, [el('tr', {}, [el('td'), cell])])]));
    expect(selectorOf(cell).startsWith('#orders')).toBe(true);
  });
});

describe('REQ-PICK-004 the selector resolves to the picked element (first match)', () => {
  it('does not use a test id that an earlier element shares', () => {
    const [first, second] = [
      el('button', { 'data-testid': 'row' }),
      el('button', { 'data-testid': 'row' }),
    ];
    mount(first, second);
    expect(selectorOf(first)).toBe('[data-testid="row"]');
    expect(selectorOf(second)).not.toBe('[data-testid="row"]');
  });

  it('does not use an id that an earlier element shares', () => {
    const [first, second] = [el('p', { id: 'dup' }), el('p', { id: 'dup' })];
    mount(first, second);
    expect(selectorOf(second)).not.toBe('#dup');
  });

  it.each([
    ['id', 'a.b:c'],
    ['id', '1st'],
    ['data-testid', 'say "hi" \\ bye'],
    ['aria-label', 'Close ✕ dialog'],
  ])('escapes the %s %s', (attribute, value) => {
    const target = el('button', { [attribute]: value });
    mount(target);
    selectorOf(target);
  });
});

describe('REQ-PICK-004 the selector stays within 300 characters', () => {
  it('skips a value that would make it too long', () => {
    const button = el('button', { 'aria-label': 'x'.repeat(320), class: 'close' });
    mount(button);
    expect(selectorOf(button)).toBe('button.close');
  });

  it('keeps a class list with long names short', () => {
    const names = Array.from({ length: 8 }, (_, i) => `a-rather-long-hand-written-class-${i}`);
    const shared = { class: names.join(' ') };
    const target = el('div', shared);
    mount(el('div', shared), target);
    selectorOf(target);
  });
});

// ── Property: any picked element in any tree gets a selector that finds it ──────────────────────

type TreeNode = { tag: string; attrs: Attrs; children: TreeNode[] };

const value = fc.constantFrom(
  'main',
  'row',
  'save',
  'a.b',
  'x"y',
  '1st',
  'héllo wörld',
  'css-1x2y3z',
  'ember1234',
  '_a1b2c3',
);
const attrs: fc.Arbitrary<Attrs> = fc.dictionary(
  fc.constantFrom('id', 'class', 'data-testid', 'data-qa', 'aria-label', 'name', 'role'),
  value,
  { maxKeys: 3 },
);
const tag = fc.constantFrom('div', 'span', 'button', 'section', 'li', 'p', 'my-widget');
const tree = fc.letrec<{ node: TreeNode }>((self) => ({
  node: fc.record({
    tag,
    attrs,
    children: fc.oneof(
      { maxDepth: 5, depthIdentifier: 'tree' },
      fc.constant<TreeNode[]>([]),
      fc.array(self('node'), { maxLength: 4 }),
    ),
  }),
})).node;

function build(node: TreeNode): HTMLElement {
  return el(node.tag, node.attrs, node.children.map(build));
}

describe('REQ-PICK-004 property: every element of a generated tree', () => {
  it('gets a selector ≤ 300 characters whose first match is that element', () => {
    assertProperty(
      fc.property(tree, fc.nat(), (spec, index) => {
        const root = build(spec);
        mount(root);
        try {
          const all = [root, ...root.querySelectorAll('*')];
          const picked = all[index % all.length] as Element;
          const selector = generateSelector(picked);
          expect(selector).toBeDefined();
          expect((selector as string).length).toBeLessThanOrEqual(300);
          expect(document.querySelector(selector as string)).toBe(picked);
        } finally {
          fixtures.pop()?.remove();
        }
      }),
    );
  });
});
