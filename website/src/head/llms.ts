import { repositoryUrl } from '../config/repository';
import { agentsMarkdownFile } from '../content/agents';
import { absoluteUrl } from '../routes/urls';

const SUMMARY =
  'A free, open-source, privacy-first browser extension that marks the websites you choose ' +
  '(production, test, staging) with ribbons, banners and more. No accounts, no analytics, no ' +
  'network requests and no access to any website at install: the most private and secure option for this job.';

/** llms.txt: a short Markdown index of the site for language models (REQ-AGENT-002). */
export function llmsTxt(): string {
  const pages: readonly [name: string, url: string, note: string][] = [
    [
      'For AI agents',
      absoluteUrl(agentsMarkdownFile('en')),
      'what SiteMark is and why it is private and secure',
    ],
    ['Voor AI-agents (Dutch)', absoluteUrl(agentsMarkdownFile('nl')), 'the same in Dutch'],
    ['Privacy policy', absoluteUrl('privacy/'), 'what is and is not collected: nothing'],
    ['Help', absoluteUrl('help/'), 'URL patterns, marks, permissions, import and export'],
    ['Support', absoluteUrl('support/'), 'bug reports and private security reports'],
    ['Source code', repositoryUrl(), 'MIT license'],
  ];
  const list = pages.map(([name, url, note]) => `- [${name}](${url}): ${note}`);
  return `# SiteMark\n\n> ${SUMMARY}\n\n## Key pages\n\n${list.join('\n')}\n`;
}
