import { describe, expect, it } from 'vitest';
import { isStableToken } from './selector-tokens';

describe('REQ-PICK-004 stable tokens: hand-written names are kept', () => {
  it.each([
    'nav',
    'btn-danger',
    'delete-customer',
    'btn_primary',
    'card__title',
    'card--active',
    'navBar',
    'myNavBar',
    'MyButton',
    'getURLs',
    'HTTPS',
    'h1',
    'col-12',
    'mt-4',
    'item2',
    '2xl',
    'x86_64',
    'md:flex',
    'w-1/2',
    '_private',
    'css-grid',
    'facade',
    'submit',
    'data-table',
  ])('%s is stable', (token) => {
    expect(isStableToken(token)).toBe(true);
  });
});

describe('REQ-PICK-004 stable tokens: generated names are skipped', () => {
  it.each([
    ['css-1x2y3z', 'emotion'],
    ['css-1dbjc4n', 'emotion (react-native-web)'],
    ['css-1x2y3z-Button', 'emotion with a label'],
    ['sc-bdVaJa', 'styled-components component id'],
    ['sc-AxjAm', 'styled-components component id'],
    ['kHqFyX', 'styled-components generated class'],
    ['jsx-2893736141', 'styled-jsx'],
    ['svelte-1x2abc', 'svelte scoped class'],
    ['_a1b2c3', 'hashed CSS module'],
    ['_root_1x2y3_1', 'Vite CSS module'],
    ['Button_root__3xYz9', 'Next.js CSS module'],
    ['Button_root__xYzAb', 'Next.js CSS module without digits'],
    ['Button-module__root___abc12', 'CSS module with a module suffix'],
    ['e3b0c442', 'long hex run'],
    ['icon-a3f9c2', 'hex run in a segment'],
    ['ember1234', 'long digit run'],
    ['row-20240925', 'long digit run in a segment'],
    ['a1b2c3', 'alternating letters and digits'],
  ])('%s is generated (%s)', (token) => {
    expect(isStableToken(token)).toBe(false);
  });

  it.each(['', ' ', 'a b', 'x'.repeat(65)])('rejects the unusable token %j', (token) => {
    expect(isStableToken(token)).toBe(false);
  });

  it('accepts a token of exactly 64 characters', () => {
    expect(isStableToken('a'.repeat(64))).toBe(true);
  });
});
