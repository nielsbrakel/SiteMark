import { describe, expect, it } from 'vitest';
import { readDocs } from './docs.ts';

const extension = {
  spec: `
| REQ-URL-001 | M   | Wildcards |
| REQ-PRIV-007 | M   | Policy |
`,
  tasks: `
## M1 — Core

| Task  | Description | REQs | Tests | Status |
| ----- | ----------- | ---- | ----- | ------ |
| T-032 | Parser | REQ-URL-001 | \`parse.test.ts\` | ✅ |
`,
};

const website = {
  spec: `
| REQ-WEB-001 | M   | Pages |
| REQ-SEO-001 | C   | Titles |
`,
  tasks: `
## W1 — Website foundation (before T-152)

| Task  | Description | REQs | Tests | Status |
| ----- | ----------- | ---- | ----- | ------ |
| T-204 | Routes | REQ-WEB-001, REQ-PRIV-007 | \`website/src/routes/routes.test.ts\` | ☐ |

## W2 — Help & playground (after M6)

| Task  | Description | REQs | Tests | Status |
| ----- | ----------- | ---- | ----- | ------ |
| T-230 | Screenshots | REQ-SEO-001 | — | ☐ |
`,
};

describe('REQ-NFR-004 progress reads the extension and the website docs together', () => {
  it('merges requirements and milestones from both documents, in order', () => {
    const docs = readDocs([extension, website]);
    expect(docs.requirements.map((r) => r.id)).toEqual([
      'REQ-URL-001',
      'REQ-PRIV-007',
      'REQ-WEB-001',
      'REQ-SEO-001',
    ]);
    expect(docs.milestones.map((m) => [m.id, m.name])).toEqual([
      ['M1', 'Core'],
      ['W1', 'Website foundation (before T-152)'],
      ['W2', 'Help & playground (after M6)'],
    ]);
    expect(docs.milestones[1]?.tasks[0]?.reqs).toEqual(['REQ-WEB-001', 'REQ-PRIV-007']);
    expect(docs.requirementDuplicates).toEqual([]);
    expect(docs.taskDuplicates).toEqual([]);
  });

  it('reports a requirement or task that both documents define', () => {
    const clash = {
      spec: '| REQ-URL-001 | M   | Again |\n',
      tasks: '## W1 — Website\n\n| T-032 | Again | — | — | ☐ |\n',
    };
    const docs = readDocs([extension, clash]);
    expect(docs.requirementDuplicates).toEqual(['REQ-URL-001']);
    expect(docs.taskDuplicates).toEqual(['T-032']);
  });
});
