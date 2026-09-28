import { describe, expect, it } from 'vitest';
import { websiteLocales } from '../i18n/locales';
import { helpTopics } from '../routes/help-topics';
import { helpContentProblems, helpTopicsFor, parseFrontMatter } from './help';

describe('REQ-PAGE-004 help topics: Markdown files with front matter', () => {
  it('reads the title, the description and the order, and keeps the rest as the body', () => {
    const parsed = parseFrontMatter(
      '---\ntitle: URL patterns\ndescription: Which pages a site group marks.\norder: 2\n---\n\nText.\n',
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        title: 'URL patterns',
        description: 'Which pages a site group marks.',
        order: 2,
        body: 'Text.\n',
      },
    });
  });

  it.each([
    ['no front matter', 'Just text'],
    ['an unclosed front matter', '---\ntitle: A\n'],
    ['a missing title', '---\ndescription: B\norder: 1\n---\nText'],
    ['a missing description', '---\ntitle: A\norder: 1\n---\nText'],
    ['an order that is not a whole number', '---\ntitle: A\ndescription: B\norder: first\n---\n'],
    ['an unknown field', '---\ntitle: A\ndescription: B\norder: 1\nauthor: C\n---\n'],
  ])('refuses %s', (_case, text) => {
    expect(parseFrontMatter(text).ok).toBe(false);
  });

  it('has the eight topics of the route table', () => {
    expect(helpTopics()).toEqual([
      'getting-started',
      'url-patterns',
      'marks-and-effects',
      'picking-an-element',
      'hiding-marks-and-shortcuts',
      'permissions',
      'import-and-export',
      'troubleshooting',
    ]);
  });

  it('has the same topic files in English and Dutch, all with valid front matter', () => {
    expect(helpContentProblems()).toEqual([]);
  });

  it.each(websiteLocales())('%s: lists the topics in their order, one file per topic', (locale) => {
    const topics = helpTopicsFor(locale);
    expect(topics.map((topic) => topic.topic)).toEqual(helpTopics());
    expect(topics.map((topic) => topic.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const topic of topics) {
      expect(topic.file).toBe(`website/content/${locale}/help/${topic.topic}.md`);
      expect(topic.title.length, topic.file).toBeLessThanOrEqual(36);
      expect(topic.description.length, topic.file).toBeLessThanOrEqual(160);
      expect(topic.body.trim(), topic.file).not.toBe('');
      // The page renders the title as its h1: the body starts below it.
      expect(topic.body, topic.file).not.toMatch(/^# /m);
    }
  });
});
