import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootstrapScript, saveThemeChoice, themeBootstrap } from './bootstrap';

const KEY = 'sitemark-website:theme';

/** A Storage stand-in that records which keys were touched. */
function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const touched: string[] = [];
  return {
    items,
    touched,
    getItem(key: string) {
      touched.push(key);
      return items.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      touched.push(key);
      items.set(key, value);
    },
    removeItem(key: string) {
      touched.push(key);
      items.delete(key);
    },
  };
}

const blocked = () => {
  throw new Error('SecurityError: storage is disabled');
};

/** Runs the exact inline script in an empty realm: only `document` and `localStorage` exist. */
function runInline(storage: object | 'blocked') {
  const root = { dataset: {} as Record<string, string> };
  const context: Record<string, unknown> = { document: { documentElement: root } };
  if (storage === 'blocked') Object.defineProperty(context, 'localStorage', { get: blocked });
  else context.localStorage = storage;
  runInNewContext(bootstrapScript(), context);
  return root.dataset;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('REQ-WEBUX-002 the inline bootstrap applies the theme before first paint', () => {
  it.each(['light', 'dark'])('applies a stored "%s" to <html data-theme>', (theme) => {
    expect(runInline(fakeStorage({ [KEY]: theme }))).toEqual({ js: '', theme });
  });

  it('follows the OS when nothing, or something unknown, is stored', () => {
    expect(runInline(fakeStorage())).toEqual({ js: '' });
    expect(runInline(fakeStorage({ [KEY]: 'purple' }))).toEqual({ js: '' });
  });

  it('follows the OS when storage is blocked, and still marks JavaScript as available', () => {
    expect(runInline('blocked')).toEqual({ js: '' });
  });

  it('is a small self-contained script that the HTML parser keeps intact', () => {
    const script = bootstrapScript();
    expect(script.length).toBeLessThan(400);
    expect(script).not.toMatch(/<\/script|<!--/i);
  });

  it('does the same when called directly', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [KEY]: 'dark' }));
    const root = { dataset: {} } as HTMLElement;
    themeBootstrap(root);
    expect({ ...root.dataset }).toEqual({ js: '', theme: 'dark' });
  });
});

describe('REQ-WEB-004 web storage holds only the theme choice', () => {
  it('reads only the sitemark-website:theme key', () => {
    const storage = fakeStorage({ [KEY]: 'light', other: 'dark' });
    runInline(storage);
    expect(new Set(storage.touched)).toEqual(new Set([KEY]));
  });

  it('stores light and dark under that key and removes it for auto', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    saveThemeChoice('dark');
    expect([...storage.items]).toEqual([[KEY, 'dark']]);
    saveThemeChoice('light');
    expect([...storage.items]).toEqual([[KEY, 'light']]);
    saveThemeChoice('auto');
    expect([...storage.items]).toEqual([]);
    expect(new Set(storage.touched)).toEqual(new Set([KEY]));
  });

  it('keeps working when storage is blocked (the choice just is not remembered)', () => {
    vi.stubGlobal('localStorage', {
      setItem: blocked,
      removeItem: blocked,
      getItem: blocked,
    });
    expect(() => saveThemeChoice('dark')).not.toThrow();
    expect(() => saveThemeChoice('auto')).not.toThrow();
  });
});
