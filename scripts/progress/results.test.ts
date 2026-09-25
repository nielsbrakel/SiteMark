import { describe, expect, it } from 'vitest';
import { coveredRequirements, passingTitles } from './results.ts';

const vitest = {
  testResults: [
    {
      assertionResults: [
        { fullName: 'REQ-URL-001 wildcard matching a → b', status: 'passed' },
        { fullName: 'REQ-URL-002 shorthand x', status: 'failed' },
        { fullName: 'REQ-URL-003 errors y', status: 'skipped' },
      ],
    },
  ],
};

const playwright = {
  suites: [
    {
      title: 'popup.spec.ts',
      specs: [{ title: 'shows status', tags: ['@REQ-POP-001'], ok: true }],
      suites: [
        {
          title: 'REQ-PRIV-002 permissions',
          specs: [
            { title: 'asks once', tags: [], ok: true },
            { title: 'REQ-PICK-003 never clicks through', tags: [], ok: false },
          ],
        },
      ],
    },
  ],
};

describe('REQ-NFR-004 coverage counts only passing tests that name a requirement (D-210)', () => {
  it('reads passing test titles from Vitest and Playwright JSON reports', () => {
    expect(passingTitles({ vitest, playwright })).toEqual([
      'REQ-URL-001 wildcard matching a → b',
      'popup.spec.ts shows status @REQ-POP-001',
      'popup.spec.ts REQ-PRIV-002 permissions asks once',
    ]);
  });

  it('maps titles to the requirement IDs they name', () => {
    const titles = passingTitles({ vitest, playwright });
    expect([...coveredRequirements(titles)].sort()).toEqual([
      'REQ-POP-001',
      'REQ-PRIV-002',
      'REQ-URL-001',
    ]);
  });

  it('tolerates missing reports', () => {
    expect(passingTitles({})).toEqual([]);
  });
});
