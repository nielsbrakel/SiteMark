import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pickerFiles } from '../../src/platform/picker-files';
import { outDir, readManifest, targets } from './targets';

/** Strings that only the background's libraries contain: a picker that has them is too big. */
const BACKGROUND_ONLY = [
  ['zod', '_zod'],
  ['regexpp', 'Lone quantifier brackets'],
  ['the URL engine (and compose)', 'patternTooBroad'],
  ['React', 'react.transitional.element'],
];

describe.each(targets())('%s picker bundle', (target) => {
  describe('REQ-PICK-001 the injected picker ships, and only on demand', () => {
    it('ships every file the background injects', () => {
      const missing = pickerFiles().filter((file) => !existsSync(path.join(outDir(target), file)));
      expect(missing).toEqual([]);
    });

    it('is not a manifest content script', () => {
      const scripts = (readManifest(target).content_scripts ?? []) as { js?: string[] }[];
      const listed = scripts.flatMap((script) => script.js ?? []);
      expect(listed.filter((file) => pickerFiles().includes(file))).toEqual([]);
    });
  });

  describe('REQ-NFR-002 the picker leaves the background code out', () => {
    it.each(BACKGROUND_ONLY)('does not bundle %s', (_name, marker) => {
      const code = pickerFiles().map((file) =>
        readFileSync(path.join(outDir(target), file), 'utf8'),
      );
      expect(code.filter((text) => text.includes(marker))).toEqual([]);
    });
  });
});
