import { describe, expect, it } from 'vitest';
import { isPolicyFile, lastUpdated, policyDateProblems } from './check-policy-date.ts';

const en = (date: string, body = 'We collect nothing.') =>
  `# Privacy policy\n\nLast updated: ${date}\n\n${body}\n`;
const nl = (date: string, body = 'We verzamelen niets.') =>
  `# Privacyverklaring\n\nLaatst bijgewerkt: ${date}\n\n${body}\n`;

describe('REQ-POLICY-004 CI fails when a policy changes without a new Last updated date', () => {
  it('reads the date of the English and the Dutch line', () => {
    expect(lastUpdated(en('2026-09-26'))).toBe('2026-09-26');
    expect(lastUpdated(nl('2027-01-31'))).toBe('2027-01-31');
    expect(lastUpdated('# Privacy policy\n\nNo date here.\n')).toBeUndefined();
    expect(lastUpdated('Last updated: 26-09-2026\n')).toBeUndefined();
  });

  it('knows which files are policy files', () => {
    expect(isPolicyFile('PRIVACY.md')).toBe(true);
    expect(isPolicyFile('PRIVACY.nl.md')).toBe(true);
    expect(isPolicyFile('docs/PRIVACY.md')).toBe(false);
    expect(isPolicyFile('SECURITY.md')).toBe(false);
  });

  it('accepts a change that also moves the date forward', () => {
    expect(
      policyDateProblems([
        { file: 'PRIVACY.md', before: en('2026-09-26'), after: en('2026-10-02', 'New text.') },
        { file: 'PRIVACY.nl.md', before: nl('2026-09-26'), after: nl('2026-10-02', 'Nieuw.') },
      ]),
    ).toEqual([]);
  });

  it('fails a change that keeps the old date', () => {
    const problems = policyDateProblems([
      { file: 'PRIVACY.nl.md', before: nl('2026-09-26'), after: nl('2026-09-26', 'Nieuw.') },
    ]);
    expect(problems).toEqual([
      'PRIVACY.nl.md changed, but its "Last updated" date is still 2026-09-26',
    ]);
  });

  it('fails a date that goes back or is not a real day', () => {
    expect(
      policyDateProblems([
        { file: 'PRIVACY.md', before: en('2026-09-26'), after: en('2026-09-25', 'x') },
        { file: 'PRIVACY.nl.md', before: nl('2026-09-26'), after: nl('2026-02-30', 'x') },
      ]),
    ).toEqual([
      'PRIVACY.md: the "Last updated" date 2026-09-25 is before the previous 2026-09-26',
      'PRIVACY.nl.md: the "Last updated" date 2026-02-30 is not a real date',
    ]);
  });

  it('fails a policy without a date line, and a deleted policy', () => {
    expect(
      policyDateProblems([
        { file: 'PRIVACY.md', before: en('2026-09-26'), after: '# Privacy policy\n\nText.\n' },
        { file: 'PRIVACY.nl.md', before: nl('2026-09-26'), after: undefined },
      ]),
    ).toEqual([
      'PRIVACY.md has no "Last updated: YYYY-MM-DD" line',
      'PRIVACY.nl.md was deleted, but the website and the store listings need it',
    ]);
  });

  it('accepts a new policy file with a date, and ignores other files', () => {
    expect(
      policyDateProblems([
        { file: 'PRIVACY.de.md', before: undefined, after: en('2026-09-26') },
        { file: 'README.md', before: 'a', after: 'b' },
      ]),
    ).toEqual([]);
  });
});
