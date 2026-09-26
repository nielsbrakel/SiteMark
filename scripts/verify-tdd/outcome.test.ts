import { describe, expect, it } from 'vitest';
import { playwrightOutcome, vitestOutcome } from './outcome.ts';

const vitest = (results: { status: string; failureMessages?: string[] }[], message = '') => ({
  testResults: [
    {
      status: results.some((r) => r.status === 'failed') ? 'failed' : 'passed',
      message,
      assertionResults: results,
    },
  ],
});

describe('REQ-NFR-004 verify-tdd reads how the red and green runs ended', () => {
  it('accepts a red run that fails only on assertions or NotImplementedError', () => {
    const report = vitest([
      { status: 'failed', failureMessages: ['AssertionError: expected 1 to be 2'] },
      { status: 'failed', failureMessages: ['NotImplementedError: Not implemented yet'] },
      { status: 'passed' },
    ]);
    expect(vitestOutcome(report)).toEqual({ passed: 1, failed: 2, unexpected: [] });
  });

  it('flags failures that are not assertions, such as a TypeError or a suite that cannot load', () => {
    const report = vitest([
      { status: 'failed', failureMessages: ['TypeError: x is not a function'] },
    ]);
    expect(vitestOutcome(report).unexpected).toEqual(['TypeError: x is not a function']);
    const broken = vitest([], 'Error: Failed to load url ./missing');
    expect(vitestOutcome(broken).unexpected).toEqual(['Error: Failed to load url ./missing']);
  });

  it('counts Playwright results the same way', () => {
    const report = {
      suites: [
        {
          specs: [
            {
              ok: false,
              tests: [
                {
                  results: [
                    {
                      status: 'failed',
                      error: { message: 'Error: expect(received).toBe(expected)' },
                    },
                  ],
                },
              ],
            },
            { ok: true, tests: [{ results: [{ status: 'passed' }] }] },
          ],
          suites: [
            {
              specs: [
                {
                  ok: false,
                  tests: [
                    {
                      results: [
                        {
                          status: 'timedOut',
                          error: { message: 'Test timeout of 30000ms exceeded.' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(playwrightOutcome(report)).toEqual({
      passed: 1,
      failed: 2,
      unexpected: ['Test timeout of 30000ms exceeded.'],
    });
  });

  it('reads Playwright assertion errors through their terminal colors', () => {
    const colored =
      'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoEqual';
    const report = {
      suites: [
        {
          specs: [
            {
              ok: false,
              tests: [{ results: [{ status: 'failed', error: { message: colored } }] }],
            },
          ],
        },
      ],
    };
    expect(playwrightOutcome(report)).toEqual({ passed: 0, failed: 1, unexpected: [] });
  });
});
