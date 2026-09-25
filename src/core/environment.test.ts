import { describe, expect, it } from 'vitest';

describe('REQ-NFR-004 core runs without a DOM or browser APIs', () => {
  it('has no document or window global', () => {
    expect('document' in globalThis).toBe(false);
    expect('window' in globalThis).toBe(false);
  });

  it('has no extension API global', () => {
    expect('browser' in globalThis).toBe(false);
    expect('chrome' in globalThis).toBe(false);
  });
});
