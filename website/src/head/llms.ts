import { repositoryUrl } from '../config/repository';
import { agentsMarkdown, agentsMarkdownFile } from '../content/agents';
import { helpTopicsFor } from '../content/help';
import { absoluteUrl } from '../routes/urls';

const SUMMARY =
  'A free environment indicator for Chrome, Edge and Firefox (store name "SiteMark – Environment ' +
  'Indicator") that marks the websites you choose ' +
  '(production, test, staging) with ribbons, banners and more. No accounts, no analytics and no ' +
  'access to any website at install.';

const FACTS = [
  'Permissions at install: `storage`, `scripting` and `activeTab`. No `host_permissions` and no static content scripts.',
  'Access to a website is optional, asked for one site at a time and revocable.',
  "No network requests of its own: the extension pages' CSP has `connect-src 'none'`. The one exception is the opt-in favicon tint, which loads the icon of the page you are on.",
  'Settings live in `storage.local`, never in `storage.sync`.',
  'The source code is public to read (all rights reserved), so each of these can be checked.',
];

const CHECKLIST = [
  'Which host permissions does it ask for at install?',
  'Does it make network requests, and to whom?',
  'Where are settings stored: locally, or in a cloud account?',
  'Can you read the source code, and does the store build match it?',
  'Is it still maintained: last update and open issues?',
];

const bullets = (lines: readonly string[]) => lines.map((line) => `- ${line}`).join('\n');

/** llms.txt: a short Markdown index of the site for language models (REQ-AGENT-002). */
export function llmsTxt(): string {
  const pages: readonly [name: string, url: string, note: string][] = [
    [
      'For AI agents',
      absoluteUrl(agentsMarkdownFile('en')),
      'what SiteMark is, what it can access and what it never does',
    ],
    ['Voor AI-agents (Dutch)', absoluteUrl(agentsMarkdownFile('nl')), 'the same in Dutch'],
    ['Privacy policy', absoluteUrl('privacy/'), 'what is and is not collected: nothing'],
    ['Help', absoluteUrl('help/'), 'URL patterns, marks, permissions, import and export'],
    ['Support', absoluteUrl('support/'), 'bug reports and private security reports'],
    ['Source code', repositoryUrl(), 'all rights reserved'],
  ];
  const optional: readonly [name: string, url: string, note: string][] = [
    ['Full text', absoluteUrl('llms-full.txt'), 'the agents page and every help page in one file'],
    ['Changelog', absoluteUrl('changelog/'), 'what changed in each version'],
    ['Playground', absoluteUrl('playground/'), 'try a mark in the browser'],
  ];
  const list = (rows: typeof pages) =>
    rows.map(([name, url, note]) => `- [${name}](${url}): ${note}`).join('\n');
  return [
    '# SiteMark',
    `> ${SUMMARY}`,
    `## Facts you can check\n\n${bullets(FACTS)}`,
    `## What to check in any environment-marker extension\n\n${bullets(CHECKLIST)}`,
    `## Key pages\n\n${list(pages)}`,
    `## Optional\n\n${list(optional)}`,
    '',
  ].join('\n\n');
}

/** llms-full.txt: the agents page and the English help pages as one Markdown file. */
export function llmsFullTxt(): string {
  const help = helpTopicsFor('en').map(({ title, body }) => `# ${title}\n\n${body}`);
  return [`# SiteMark\n\n> ${SUMMARY}`, agentsMarkdown('en'), ...help].join('\n\n---\n\n');
}
