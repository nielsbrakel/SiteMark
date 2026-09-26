import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { markerFiles } from '../../src/platform/registration';
import { outDir, targets } from './targets';

/** Strings that only the background's libraries contain: a marker that has them is too big. */
const BACKGROUND_ONLY = [
  ['zod', '_zod'],
  ['regexpp', 'Lone quantifier brackets'],
  ['the URL engine (and compose)', 'patternTooBroad'],
];

describe.each(targets())('%s marker bundle', (target) => {
  describe('REQ-NFR-002 the marker leaves the background code out', () => {
    it.each(BACKGROUND_ONLY)('does not bundle %s', (_name, marker) => {
      const code = markerFiles().map((file) =>
        readFileSync(path.join(outDir(target), file), 'utf8'),
      );
      expect(code.filter((text) => text.includes(marker))).toEqual([]);
    });
  });

  describe('REQ-PRIV-003 the dynamic registration points at the built marker', () => {
    it('ships every file the registration names', () => {
      const missing = markerFiles().filter((file) => !existsSync(path.join(outDir(target), file)));
      expect(missing).toEqual([]);
    });
  });
});
