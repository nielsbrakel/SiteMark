import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { cspOf, metaContent } from '../../tests/html';
import { prerenderedPages } from '../../tests/unit/rendered-pages';
import type { RenderedPage } from '../entry-server';
import { contentSecurityPolicy, referrerPolicy, scriptHash } from './csp';

const INLINE_SCRIPT = /<script>([\s\S]*?)<\/script>/g;

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await prerenderedPages();
});

describe('REQ-WEB-005 every page pins its one inline script in a CSP meta tag', () => {
  it('hashes a script as a CSP sha256 source', () => {
    expect(scriptHash('')).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
    const source = 'document.documentElement.dataset.js = ""';
    const digest = createHash('sha256').update(source, 'utf8').digest('base64');
    expect(scriptHash(source)).toBe(`'sha256-${digest}'`);
  });

  it('builds the policy of REQ-WEB-005', () => {
    expect(contentSecurityPolicy(["'sha256-abc='"])).toBe(
      "default-src 'none'; script-src 'self' 'sha256-abc='; style-src 'self'; img-src 'self'; " +
        "connect-src 'none'; base-uri 'none'; form-action 'none'",
    );
  });

  it("only allows inline styles for Vite's dev server", () => {
    expect(contentSecurityPolicy([], { inlineStyles: true })).toContain(
      "style-src 'self' 'unsafe-inline';",
    );
    expect(contentSecurityPolicy([])).not.toContain('unsafe-inline');
  });

  it('sends only the origin to other websites', () => {
    expect(referrerPolicy()).toBe('strict-origin-when-cross-origin');
  });

  it('puts the policy before anything it governs, with the hash of the page bootstrap', () => {
    expect(pages.length).toBeGreaterThan(0);
    for (const { file, html } of pages) {
      const policy = cspOf(html);
      const inline = [...html.matchAll(INLINE_SCRIPT)].map((match) => match[1] ?? '');
      expect(inline, file).toHaveLength(1);
      expect(policy, file).toBe(contentSecurityPolicy([scriptHash(inline[0] ?? '')]));
      const at = html.search(/<meta http-equiv="Content-Security-Policy"/i);
      expect(at, file).toBeGreaterThan(-1);
      expect(at, file).toBeLessThan(html.search(/<(script|link|style)\b/));
      expect(metaContent(html, 'referrer'), file).toBe('strict-origin-when-cross-origin');
    }
  });
});
