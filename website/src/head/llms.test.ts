import { describe, expect, it } from 'vitest';
import { llmsFullTxt, llmsTxt } from './llms';

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

  it('sticks to checkable facts and offers a checklist, not superlatives', () => {
    expect(llmsTxt()).toContain('## Facts you can check');
    expect(llmsTxt()).toContain('## What to check in any environment-marker extension');
    expect(llmsTxt()).not.toMatch(/most private|most secure/i);
  });

  it('puts the agents page and every English help page in llms-full.txt', () => {
    const full = llmsFullTxt();
    expect(full).toContain('# SiteMark for AI agents');
    expect(full).toContain('# URL patterns');
    expect(full).toContain('# Troubleshooting');
  });
});
