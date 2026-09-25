import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SECURITY.md is a deliverable (T-027); this keeps its required sections from silently disappearing.
const policy = readFileSync('SECURITY.md', 'utf8');

describe('REQ-SEC-010 SECURITY.md documents reporting, the threat model and the non-goals', () => {
  it('explains how to report a vulnerability privately', () => {
    expect(policy).toMatch(/^## Reporting a vulnerability$/m);
    expect(policy).toContain('/security/advisories/new');
  });

  it('documents the threat model with its trust boundaries', () => {
    expect(policy).toMatch(/^## Threat model$/m);
    expect(policy).toMatch(/^### Trust boundaries$/m);
  });

  it('states the non-goals: SiteMark is not a security control (D-239)', () => {
    expect(policy).toMatch(/^### Non-goals$/m);
    expect(policy).toContain('not a security control');
  });
});
