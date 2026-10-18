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
function runInline(storage: object | 'blocked', userAgent?: string) {
  const root = { dataset: {} as Record<string, string> };
  const context: Record<string, unknown> = { document: { documentElement: root } };
  if (userAgent) context.navigator = { userAgent };
  if (storage === 'blocked') Object.defineProperty(context, 'localStorage', { get: blocked });
  else context.localStorage = storage;
  runInNewContext(bootstrapScript(), context);
  return root.dataset;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("REQ-PAGE-002 the inline bootstrap marks the visitor's browser", () => {
  it.each([
    ['Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0', 'firefox'],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      'safari',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 FxiOS/130.0 Mobile/15E148 Safari/605.1.15',
      'safari',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 EdgiOS/130.0 Mobile/15E148 Safari/605.1.15',
      'safari',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0',
      'edge',
    ],
  ])('sets data-browser for %s', (agent, browser) => {
    expect(runInline(fakeStorage(), agent)).toEqual(browser ? { js: '', browser } : { js: '' });
  });

  it('leaves Chrome and unknown browsers on the default', () => {
    expect(runInline(fakeStorage(), 'Mozilla/5.0 Chrome/130.0 Safari/537.36')).toEqual({ js: '' });
    expect(runInline(fakeStorage())).toEqual({ js: '' });
  });
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
    expect(script.length).toBeLessThan(650);
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
    saveThemeChoice('system');
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
    expect(() => saveThemeChoice('system')).not.toThrow();
  });
});
