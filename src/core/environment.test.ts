// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('REQ-NFR-004 core runs without a DOM or browser APIs', () => {
  it('has no document or window global', () => {
    expect('document' in globalThis).toBe(false);
    expect('window' in globalThis).toBe(false);
  });
});
