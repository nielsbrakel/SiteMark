import { describe, expect, it } from 'vitest';
import { llmsTxt } from './llms';

describe('REQ-AGENT-002 llms.txt indexes the agents page and the policy for language models', () => {
  it('opens with the name and a one-line summary, as the llms.txt format asks', () => {
    expect(llmsTxt()).toMatch(/^# SiteMark\n\n> .+/);
  });

  it('links the Markdown twins and the key pages by absolute URL', () => {
    for (const url of [
      'https://nielsbrakel.github.io/SiteMark/agents.md',
      'https://nielsbrakel.github.io/SiteMark/nl/agents.md',
      'https://nielsbrakel.github.io/SiteMark/privacy/',
      'https://github.com/nielsbrakel/SiteMark',
    ]) {
      expect(llmsTxt()).toContain(`](${url})`);
    }
  });
});
