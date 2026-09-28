import { describe, expect, it } from 'vitest';
import { helpTopics } from '../routes/help-topics';
import { helpTopicsFor } from './help';

// The written help (T-238): every topic says enough, in English and in Dutch, with the same
// structure in both languages and the product's own words.

const en = helpTopicsFor('en');
const nl = helpTopicsFor('nl');
const words = (text: string) => text.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
const sections = (text: string) => [...text.matchAll(/^## .+$/gm)].map((match) => match[0]);
const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 40 && !part.startsWith('#'));

describe('REQ-PAGE-004 every help topic is written out in English and Dutch', () => {
  it.each(helpTopics())('%s: at least 150 words in each language', (topic) => {
    for (const content of [en, nl].map((list) => list.find((entry) => entry.topic === topic))) {
      expect(words(content?.body ?? ''), content?.file).toBeGreaterThanOrEqual(150);
    }
  });

  it.each(helpTopics())('%s: the same sections in both languages, at least two', (topic) => {
    const [english = '', dutch = ''] = [en, nl].map(
      (list) => list.find((entry) => entry.topic === topic)?.body ?? '',
    );
    expect(sections(english).length).toBeGreaterThanOrEqual(2);
    expect(sections(dutch).length).toBe(sections(english).length);
  });

  it.each(helpTopics())('%s: the Dutch text is a translation, not a copy', (topic) => {
    const [english = '', dutch = ''] = [en, nl].map(
      (list) => list.find((entry) => entry.topic === topic)?.body ?? '',
    );
    const shared = paragraphs(dutch).filter((paragraph) => paragraphs(english).includes(paragraph));
    expect(shared).toEqual([]);
  });

  it('uses the product words: site group and sitegroep, never profile', () => {
    const english = en.map((entry) => entry.body).join('\n');
    const dutch = nl.map((entry) => entry.body).join('\n');
    expect(english).toMatch(/site group/i);
    expect(dutch).toMatch(/sitegroep/i);
    expect(`${english}\n${dutch}`).not.toMatch(/\bprofiles?\b|\bprofiel(en)?\b/i);
  });
});
