import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createGlassPane, type GlassPane } from './glass-pane';

const LABELS = {
  frameNote: 'marks the whole frame',
  componentNote: 'marks the component',
  paneName: 'SiteMark element picker',
  hint: 'Click to select · ↑↓←→ navigate · Enter select · Esc cancel',
  size: (width: number, height: number) => `${width} by ${height}`,
};

const panes: GlassPane[] = [];
const nodes: Element[] = [];

afterEach(() => {
  for (const pane of panes.splice(0)) pane.dispose();
  for (const node of nodes.splice(0)) node.remove();
});

/** A pane that highlights what it hovers, like the picker does, and records what it reports. */
function aPane() {
  const hovered: Element[] = [];
  const selected: Element[] = [];
  const keys: string[] = [];
  const hooks = {
    onHover: (element: Element) => {
      hovered.push(element);
      pane.highlight(element);
    },
    onSelect: (element: Element) => selected.push(element),
    onKey: (key: string) => keys.push(key),
  };
  const pane = createGlassPane(hooks, LABELS);
  panes.push(pane);
  return { pane, hovered, selected, keys };
}

/** A page element at a fixed place in the viewport. */
function place<E extends HTMLElement>(element: E, box = 'left:40px; top:60px'): E {
  element.setAttribute('style', `position:fixed; ${box}; margin:0; box-sizing:border-box`);
  document.body.append(element);
  nodes.push(element);
  return element;
}

function aButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'delete';
  button.className = 'btn-danger';
  button.textContent = 'Delete';
  return place(button, 'left:40px; top:60px; width:120px; height:36px');
}

const hostOf = () => document.querySelector('sitemark-picker') as HTMLElement;
const part = (name: string) =>
  hostOf().shadowRoot?.querySelector(`[data-part="${name}"]`) as HTMLElement;

describe('REQ-PICK-002 the glass pane covers the page', () => {
  it('puts its own host in the top layer, over the whole viewport', () => {
    aPane();
    expect(hostOf().matches(':popover-open')).toBe(true);
    expect(document.elementFromPoint(innerWidth / 2, innerHeight / 2)).toBe(hostOf());
    expect(document.elementFromPoint(1, 1)).toBe(hostOf());
  });

  it('leaves the page when disposed', () => {
    const { pane } = aPane();
    pane.dispose();
    pane.dispose();
    expect(document.querySelector('sitemark-picker')).toBeNull();
  });
});

describe('REQ-PICK-002 hovering outlines the element under the pointer', () => {
  it('reports the page element under the pointer, not the pane', async () => {
    const button = aButton();
    const { hovered } = aPane();
    await userEvent.hover(button, { force: true });
    expect(hovered.at(-1)).toBe(button);
  });

  it('draws a neutral two-tone dashed outline around it', async () => {
    const button = aButton();
    aPane();
    await userEvent.hover(button, { force: true });
    const outline = part('outline');
    expect(outline.hidden).toBe(false);
    const style = getComputedStyle(outline);
    expect([style.borderTopStyle, style.borderTopWidth]).toEqual(['dashed', '2px']);
    expect(style.borderTopColor).toBe('rgb(27, 29, 34)');
    expect([style.outlineStyle, style.outlineWidth]).toEqual(['solid', '2px']);
    expect(style.outlineColor).toBe('rgb(255, 255, 255)');
    const box = outline.getBoundingClientRect();
    const target = button.getBoundingClientRect();
    expect(box.left).toBeLessThanOrEqual(target.left);
    expect(box.top).toBeLessThanOrEqual(target.top);
    expect(box.right).toBeGreaterThanOrEqual(target.right);
    expect(box.bottom).toBeGreaterThanOrEqual(target.bottom);
  });

  it('shows a tooltip with the tag, id, classes and size', async () => {
    const button = aButton();
    aPane();
    await userEvent.hover(button, { force: true });
    expect(part('tooltip').hidden).toBe(false);
    expect(part('tooltip').textContent).toBe('button#delete.btn-danger · 120×36');
  });

  it('hides the outline and tooltip for no element', async () => {
    const button = aButton();
    const { pane } = aPane();
    await userEvent.hover(button, { force: true });
    pane.highlight(null);
    expect(part('outline').hidden).toBe(true);
    expect(part('tooltip').hidden).toBe(true);
  });

  it('skips SiteMark hosts under the pointer', async () => {
    const button = aButton();
    const planted = place(document.createElement('sitemark-root'), 'inset:0; pointer-events:auto');
    const { hovered } = aPane();
    await userEvent.hover(button, { force: true });
    expect(hovered).not.toContain(planted);
    expect(hovered.at(-1)).toBe(button);
  });
});

describe('REQ-PICK-002 clicking selects the element', () => {
  it('reports a click on the element under the pointer, which the page never sees', async () => {
    const button = aButton();
    let pageClicks = 0;
    button.addEventListener('click', () => pageClicks++);
    const { selected } = aPane();
    await userEvent.click(button, { force: true });
    expect(selected).toEqual([button]);
    expect(pageClicks).toBe(0);
  });

  it('ignores synthetic input', async () => {
    const button = aButton();
    const { hovered, selected } = aPane();
    const { x, y } = button.getBoundingClientRect();
    const init = { bubbles: true, composed: true, clientX: x + 5, clientY: y + 5 };
    part('pane').dispatchEvent(new PointerEvent('pointermove', init));
    part('pane').dispatchEvent(new MouseEvent('click', init));
    expect(hovered).toEqual([]);
    expect(selected).toEqual([]);
  });
});

describe('REQ-PICK-008 frames and components', () => {
  it('marks an iframe itself and says so', async () => {
    const frame = place(document.createElement('iframe'), 'left:40px; top:60px; width:200px');
    const { hovered } = aPane();
    await userEvent.hover(frame, { force: true });
    expect(hovered.at(-1)).toBe(frame);
    expect(part('tooltip').textContent).toContain('marks the whole frame');
  });

  it('marks the host of a web component, even over its shadow content, and says so', async () => {
    const host = place(document.createElement('div'), 'left:40px; top:60px');
    const inner = document.createElement('button');
    inner.textContent = 'Inside a component';
    host.attachShadow({ mode: 'open' }).append(inner);
    const { hovered } = aPane();
    await userEvent.hover(host, { force: true });
    expect(hovered.at(-1)).toBe(host);
    expect(part('tooltip').textContent).toContain('marks the component');
  });

  it('treats a custom element as a component', async () => {
    const widget = place(document.createElement('my-widget'), 'left:40px; top:60px');
    widget.textContent = 'Widget';
    widget.style.display = 'block';
    aPane();
    await userEvent.hover(widget, { force: true });
    expect(part('tooltip').textContent).toContain('marks the component');
  });

  it('marks a canvas as a whole, without a note', async () => {
    const canvas = place(document.createElement('canvas'), 'left:40px; top:60px');
    const { hovered } = aPane();
    await userEvent.hover(canvas, { force: true });
    expect(hovered.at(-1)).toBe(canvas);
    expect(part('tooltip').textContent).not.toContain('marks');
  });
});

// ── Keyboard (T-105) ──────────────────────────────────────────────────────────────────────────

const focusedPart = () => hostOf().shadowRoot?.activeElement ?? null;

describe('REQ-A11Y-002 the pane takes the keyboard focus', () => {
  it('moves focus into its shadow root, on a named element', () => {
    aPane();
    expect(document.activeElement).toBe(hostOf());
    expect(focusedPart()).toBe(part('pane'));
    expect(part('pane').getAttribute('aria-label')).toBe(LABELS.paneName);
  });

  it('keeps the focus on Tab and when the page takes it', async () => {
    const other = aButton();
    aPane();
    await userEvent.tab();
    expect(focusedPart()).toBe(part('pane'));
    other.focus();
    await expect.poll(focusedPart).toBe(part('pane'));
  });

  it('shows the keyboard hint', () => {
    aPane();
    expect(part('hint')?.textContent).toBe(LABELS.hint);
  });
});

describe('REQ-PICK-002 keys drive the picker, and the page never sees them', () => {
  it.each([
    ['{ArrowUp}', 'up'],
    ['{ArrowDown}', 'down'],
    ['{ArrowLeft}', 'left'],
    ['{ArrowRight}', 'right'],
    ['{Enter}', 'enter'],
    ['{Escape}', 'escape'],
  ])('%s → %s', async (key, reported) => {
    const { keys } = aPane();
    await userEvent.keyboard(key);
    expect(keys).toEqual([reported]);
  });

  it('keeps keys from the page and from the element that had focus', async () => {
    const button = aButton();
    let pageKeys = 0;
    let pageClicks = 0;
    const onKey = () => pageKeys++;
    document.addEventListener('keydown', onKey);
    button.addEventListener('click', () => pageClicks++);
    button.focus();
    aPane();
    await userEvent.keyboard('{Enter}{ArrowDown}x');
    document.removeEventListener('keydown', onKey);
    expect([pageKeys, pageClicks]).toEqual([0, 0]);
  });

  it('ignores synthetic keys', () => {
    const { keys } = aPane();
    const init = { key: 'Enter', bubbles: true, composed: true };
    part('pane').dispatchEvent(new KeyboardEvent('keydown', init));
    expect(keys).toEqual([]);
  });
});

describe('REQ-A11Y-011 the pane announces the candidate and returns focus', () => {
  it('announces the role, name and size in a live region', () => {
    const button = aButton();
    const { pane } = aPane();
    pane.highlight(button);
    expect(part('live')?.getAttribute('role')).toBe('status');
    expect(part('live')?.textContent).toBe('button, Delete, 120 by 36');
  });

  it('announces an unnamed element by its tag', () => {
    const box = place(document.createElement('div'), 'left:0; top:0; width:50px; height:20px');
    const { pane } = aPane();
    pane.highlight(box);
    expect(part('live')?.textContent).toBe('div, 50 by 20');
  });

  it('gives the focus back to the page element that had it', () => {
    const button = aButton();
    button.focus();
    const { pane } = aPane();
    pane.dispose();
    expect(document.activeElement).toBe(button);
  });
});
