import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { markerFiles } from '../../src/platform/registration';
import { outDir, targets } from './targets';

describe.each(targets())('%s marker bundle', (target) => {
  describe('REQ-PRIV-003 the dynamic registration points at the built marker', () => {
    it('ships every file the registration names', () => {
      const missing = markerFiles().filter((file) => !existsSync(path.join(outDir(target), file)));
      expect(missing).toEqual([]);
    });
  });
});
