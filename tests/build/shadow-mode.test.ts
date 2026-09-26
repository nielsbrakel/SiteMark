import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { markerFiles } from '../../src/platform/registration';
import { outDir, targets } from './targets';

/** Every `attachShadow(…)` argument in the shipped JavaScript of a target. */
function attachShadowArguments(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.m?js$/.test(file))
    .flatMap((file) => {
      const text = readFileSync(path.join(dir, file), 'utf8');
      return [...text.matchAll(/attachShadow\(([^)]*)\)/g)].map((m) => `${file}: ${m[1]}`);
    });
}

const closedLiteral = /: \{\s*mode:\s*(["'`])closed\1\s*\}$/;

// wxt.config.ts's define per mode is unit-tested in tests/unit/shadow-mode.test.ts.
describe.each(targets())('%s built output', (target) => {
  describe('REQ-RND-001 production attaches closed shadow roots only (D-226)', () => {
    it('passes a literal mode "closed" to every attachShadow call', () => {
      const calls = attachShadowArguments(outDir(target));
      expect(calls.filter((call) => !closedLiteral.test(call))).toEqual([]);
    });

    it('attaches a closed shadow root in the marker content script', () => {
      const marker = markerFiles().map((file) => `${file}: `);
      const calls = attachShadowArguments(outDir(target)).filter((call) =>
        marker.some((prefix) => call.startsWith(prefix)),
      );
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.filter((call) => !closedLiteral.test(call))).toEqual([]);
    });

    it('leaves no __SHADOW_MODE__ placeholder behind', () => {
      const dir = outDir(target);
      const leftovers = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
        (file) =>
          /\.m?js$/.test(file) &&
          readFileSync(path.join(dir, file), 'utf8').includes('__SHADOW_MODE__'),
      );
      expect(leftovers).toEqual([]);
    });
  });
});
