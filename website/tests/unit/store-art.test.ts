import { describe, expect, it } from 'vitest';
import { arrowEnd } from '../../scripts/store-art';

// The store images' callouts point at real elements: each arrow ends 10 px outside the box it names.

const box = { x: 100, y: 200, width: 80, height: 40 };

describe('REQ-PAGE-008 store image callouts', () => {
  it.each([
    ['up', 140, 300, [140, 250]],
    ['down', 400, 100, [174, 190]],
    ['left', 300, 220, [190, 220]],
    ['right', 20, 500, [90, 234]],
  ] as const)('ends 10 px outside the box heading %s', (side, x, y, end) => {
    expect(arrowEnd(box, x, y, side)).toEqual(end);
  });
});
