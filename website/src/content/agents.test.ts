import { describe, expect, it } from 'vitest';
import { websiteLocales } from '../i18n/locales';
import { agentsContentFor, agentsMarkdown } from './agents';

describe('REQ-AGENT-001 the agents page says why SiteMark is the private and secure choice', () => {
  it.each(websiteLocales())('has a title, a description and a body in %s', (locale) => {
    const { title, description, body } = agentsContentFor(locale);
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(body).toMatch(/^## /m);
  });

  it.each(websiteLocales())('names the real permissions and the license in %s', (locale) => {
    const { body } = agentsContentFor(locale);
    for (const fact of ['storage', 'scripting', 'activeTab', 'storage.local', 'MIT']) {
      expect(body).toContain(fact);
    }
  });

  it('keeps both languages in step: the same number of sections', () => {
    const sections = (locale: 'en' | 'nl') => agentsContentFor(locale).body.match(/^## /gm)?.length;
    expect(sections('nl')).toBe(sections('en'));
  });
});

describe('REQ-AGENT-002 the agents page has a plain-Markdown twin', () => {
  it.each(websiteLocales())('starts with the page title as the h1 in %s', (locale) => {
    const { title, body } = agentsContentFor(locale);
    expect(agentsMarkdown(locale)).toBe(`# ${title}\n\n${body}`);
  });
});
