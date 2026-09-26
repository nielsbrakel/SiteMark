import { globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { policyFor } from '../../src/content/policy';

// The privacy policy (docs/website/spec.md §5.3) is PRIVACY.md and PRIVACY.nl.md. These tests keep
// its required parts from silently disappearing in either language.

type Heading = { level: number; text: string };

/** The ATX headings of a Markdown text (the policy has no code blocks). */
function headings(source: string): Heading[] {
  return [...source.matchAll(/^(#{1,6}) (.+)$/gm)].map((m) => ({
    level: m[1]?.length ?? 0,
    text: (m[2] ?? '').trim(),
  }));
}

/** The text below a heading, up to the next heading of the same or a higher level. */
function section(source: string, title: string): string {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => /^#{1,6} /.test(line) && line.endsWith(` ${title}`));
  if (start < 0) return '';
  const level = lines[start]?.match(/^#+/)?.[0].length ?? 0;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => (line.match(/^(#+) /)?.[1]?.length ?? 7) <= level);
  return rest.slice(0, end < 0 ? undefined : end).join('\n');
}

const en = () => policyFor('en').source;
const nl = () => policyFor('nl').source;

/** Every required section, by its heading in each language, and what it must say. */
const REQUIRED: { en: string; nl: string; says: RegExp[] }[] = [
  { en: 'The extension', nl: 'De extensie', says: [] },
  { en: 'No data is collected', nl: 'Er worden geen gegevens verzameld', says: [] },
  { en: 'What stays in your browser', nl: 'Wat in je browser blijft', says: [/storage\.local/] },
  {
    en: 'Permissions and why SiteMark needs them',
    nl: 'Rechten en waarom SiteMark ze nodig heeft',
    says: [/`storage`/, /`scripting`/, /`activeTab`/, /optional_host_permissions|\*:\/\/\*\/\*/],
  },
  { en: 'The favicon image request', nl: 'Het faviconverzoek', says: [/favicon/i] },
  {
    en: 'Web pages can detect marks',
    nl: "Webpagina's kunnen markeringen zien",
    says: [],
  },
  {
    en: 'The title prefix and your browser history',
    nl: 'Het titelvoorvoegsel en je browsergeschiedenis',
    says: [],
  },
  { en: 'Export files', nl: 'Exportbestanden', says: [/host/i] },
  { en: 'The website', nl: 'De website', says: [] },
  {
    en: 'No cookies, analytics or third parties',
    nl: 'Geen cookies, analytics of derden',
    says: [],
  },
  { en: 'Your theme choice', nl: 'Je themakeuze', says: [/sitemark-website:theme/] },
  {
    en: 'Hosting by GitHub Pages',
    nl: 'Hosting door GitHub Pages',
    says: [
      /IP/,
      /https:\/\/docs\.github\.com\/en\/site-policy\/privacy-policies\/github-general-privacy-statement/,
    ],
  },
  { en: 'GitHub Issues are public', nl: 'GitHub Issues zijn openbaar', says: [/GitHub/] },
  { en: 'Who is responsible', nl: 'Wie is verantwoordelijk', says: [/Niels Brakel/] },
  {
    en: 'Contact',
    nl: 'Contact',
    says: [
      /https:\/\/github\.com\/nielsbrakel\/SiteMark\/issues/,
      /https:\/\/github\.com\/nielsbrakel\/SiteMark\/security\/advisories\/new/,
    ],
  },
];

describe('REQ-POLICY-001 PRIVACY.md and PRIVACY.nl.md are the only copy of the policy', () => {
  it('reads the English and the Dutch policy from the repository root', () => {
    expect(policyFor('en').file).toBe('PRIVACY.md');
    expect(policyFor('nl').file).toBe('PRIVACY.nl.md');
    expect(en()).toMatch(/^# Privacy policy$/m);
    expect(nl()).toMatch(/^# Privacyverklaring$/m);
  });

  it('keeps no other copy of the policy in the repository', () => {
    // Dependencies, build output and dot folders (git worktrees too) aren't the repository's files.
    const skip = (file: string) => /(^|\/)(node_modules|dist|\.[^/]+)$/.test(file);
    const copies = globSync('**/PRIVACY*.md', { exclude: skip });
    expect(copies.sort()).toEqual(['PRIVACY.md', 'PRIVACY.nl.md']);
  });

  it('has the same heading structure in both languages', () => {
    const levels = (source: string) => headings(source).map((heading) => heading.level);
    expect(headings(en()).length).toBeGreaterThan(10);
    expect(levels(nl())).toEqual(levels(en()));
    expect(headings(en()).filter((heading) => heading.level === 1)).toHaveLength(1);
  });
});

describe('REQ-POLICY-002 REQ-PRIV-007 the policy covers the extension and the website', () => {
  it.each(REQUIRED)('has "$en" / "$nl" at the same place in both languages', (required) => {
    const index = headings(en()).findIndex((heading) => heading.text === required.en);
    expect(index, required.en).toBeGreaterThanOrEqual(0);
    expect(headings(nl())[index]?.text).toBe(required.nl);
    for (const [source, title] of [
      [en(), required.en],
      [nl(), required.nl],
    ] as const) {
      const text = section(source, title);
      expect(text.trim(), title).not.toBe('');
      for (const pattern of required.says) expect(text, title).toMatch(pattern);
    }
  });

  it('says that no data is collected and nothing leaves the browser', () => {
    expect(section(en(), 'No data is collected')).toMatch(/doesn't collect/);
    expect(section(nl(), 'Er worden geen gegevens verzameld')).toMatch(/verzamelt geen/);
  });
});

describe('REQ-POLICY-003 the policy names the controller and contact goes through GitHub only', () => {
  it.each([
    ['en', en, 'Niels Brakel, the Netherlands'],
    ['nl', nl, 'Niels Brakel, Nederland'],
  ])('%s names the controller', (_locale, source, controller) => {
    expect(source()).toContain(controller);
  });

  it.each([
    ['en', en],
    ['nl', nl],
  ])('%s has no email or postal address', (_locale, source) => {
    expect(source()).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});

describe('REQ-POLICY-004 every policy file has a Last updated date', () => {
  it.each([
    ['en', en, /^Last updated: \d{4}-\d{2}-\d{2}$/m],
    ['nl', nl, /^Laatst bijgewerkt: \d{4}-\d{2}-\d{2}$/m],
  ])('%s has one "Last updated" line', (_locale, source, line) => {
    expect(source().match(new RegExp(line.source, 'gm'))).toHaveLength(1);
  });

  it('gives both languages the same date', () => {
    const date = (source: string) => source.match(/: (\d{4}-\d{2}-\d{2})$/m)?.[1];
    expect(date(nl())).toBe(date(en()));
  });
});
