import { describe, expect, it } from 'vitest';
import { type CheckInput, check } from './check.ts';
import { parseCommits } from './model.ts';

const base = (): CheckInput => ({
  requirements: [
    { id: 'REQ-URL-001', priority: 'M' },
    { id: 'REQ-URL-002', priority: 'M' },
  ],
  requirementDuplicates: [],
  milestones: [
    {
      id: 'M1',
      name: 'Core',
      tasks: [
        { id: 'T-032', reqs: ['REQ-URL-001'], tests: ['src/core/url/parse.test.ts'], done: true },
        { id: 'T-033', reqs: ['REQ-URL-002'], tests: ['glob.test.ts'], done: false },
      ],
    },
  ],
  taskDuplicates: [],
  commits: parseCommits('a\ttest(T-032): red — x\nb\tfeat(T-032): green — x'),
  legacyDone: [],
  mentionedRequirements: new Set(['REQ-URL-001']),
  covered: new Set(['REQ-URL-001']),
  fileExists: () => true,
});

const codes = (input: Partial<CheckInput>) => check({ ...base(), ...input }).map((p) => p.code);

describe('REQ-NFR-004 progress --strict fails on broken traceability', () => {
  it('passes a consistent project', () => {
    expect(check(base())).toEqual([]);
  });

  it('reports duplicates, orphans and unknown IDs', () => {
    expect(codes({ requirementDuplicates: ['REQ-URL-001'], taskDuplicates: ['T-032'] })).toEqual([
      'duplicate-requirement',
      'duplicate-task',
    ]);
    expect(
      codes({ requirements: [...base().requirements, { id: 'REQ-URL-009', priority: 'M' }] }),
    ).toEqual(['requirement-without-task']);
    expect(codes({ mentionedRequirements: new Set(['REQ-NOPE-001']) })).toEqual([
      'unknown-requirement',
    ]);
  });

  it('reports a status column that disagrees with git', () => {
    expect(codes({ commits: [] })).toEqual(['status-mismatch']);
    expect(codes({ commits: parseCommits('a\ttest(T-032): red — x') })).toEqual([
      'status-mismatch',
    ]);
    expect(codes({ commits: [], legacyDone: ['T-032'] })).toEqual([]);
  });

  it('reports green without a preceding red', () => {
    const commits = parseCommits(
      'a\tfeat(T-032): green — x\nb\ttest(T-032): red — y\nc\tfeat(T-032): green — y',
    );
    expect(codes({ commits })).toEqual(['green-without-red']);
  });

  it('reports test paths of done tasks that do not exist', () => {
    expect(codes({ fileExists: () => false })).toEqual(['missing-test-path']);
  });

  it('reports a finished requirement that no passing test names, once reports exist', () => {
    expect(codes({ covered: new Set() })).toEqual(['uncovered-requirement']);
    expect(codes({ covered: undefined })).toEqual([]);
  });
});
