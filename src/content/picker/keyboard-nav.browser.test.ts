import { afterEach, describe, expect, it } from 'vitest';
import { navigate, startElement } from './keyboard-nav';

const nodes: Element[] = [];

afterEach(() => {
  for (const node of nodes.splice(0)) node.remove();
  (document.activeElement as HTMLElement | null)?.blur();
});

function el(tag: string, id: string, children: readonly Element[] = []): HTMLElement {
  const element = document.createElement(tag);
  element.id = id;
  element.append(...children);
  return element;
}

/** section > p#a, p#hidden (display:none), div#b > (span#b1, span#b2), script, p#c */
function aTree() {
  const hidden = el('p', 'hidden');
  hidden.style.display = 'none';
  const tree = el('section', 's', [
    el('p', 'a'),
    hidden,
    el('div', 'b', [el('span', 'b1'), el('span', 'b2')]),
    document.createElement('script'),
    el('p', 'c'),
  ]);
  for (const p of tree.querySelectorAll('p, span')) p.textContent = p.id;
  document.body.append(tree);
  nodes.push(tree);
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  return { tree, byId };
}

describe('REQ-PICK-002 keyboard navigation between candidates', () => {
  it('↑ moves to the parent, but never above <body>', () => {
    const { tree, byId } = aTree();
    expect(navigate(byId('b1'), 'up')).toBe(byId('b'));
    expect(navigate(byId('b'), 'up')).toBe(tree);
    expect(navigate(document.body, 'up')).toBe(document.body);
  });

  it('↓ moves to the first child, and stays on a leaf', () => {
    const { tree, byId } = aTree();
    expect(navigate(tree, 'down')).toBe(byId('a'));
    expect(navigate(byId('b'), 'down')).toBe(byId('b1'));
    expect(navigate(byId('b1'), 'down')).toBe(byId('b1'));
  });

  it('← and → move between siblings, skipping elements without a box', () => {
    const { byId } = aTree();
    expect(navigate(byId('a'), 'right')).toBe(byId('b'));
    expect(navigate(byId('b'), 'right')).toBe(byId('c'));
    expect(navigate(byId('c'), 'right')).toBe(byId('c'));
    expect(navigate(byId('b'), 'left')).toBe(byId('a'));
    expect(navigate(byId('a'), 'left')).toBe(byId('a'));
  });
});

describe('REQ-PICK-002 keyboard picking starts at the focused element', () => {
  it('starts at document.activeElement', () => {
    const input = document.createElement('input');
    document.body.append(input);
    nodes.push(input);
    input.focus();
    expect(startElement()).toBe(input);
  });

  it('starts at the element in the viewport center when nothing is focused', () => {
    const cover = document.createElement('div');
    cover.setAttribute('style', 'position:fixed; inset:0');
    document.body.append(cover);
    nodes.push(cover);
    expect(startElement()).toBe(cover);
  });
});
