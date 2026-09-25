import { describe, expect, it } from 'vitest';
import { cssAttrValue, cssEscapeIdent, isStableToken } from './selector-tokens';

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

describe('REQ-PICK-004 cssEscapeIdent escapes an identifier like CSS.escape()', () => {
  it.each([
    ['', ''],
    ['nav', 'nav'],
    ['btn-danger', 'btn-danger'],
    ['a0b', 'a0b'],
    ['_x', '_x'],
    ['--a', '--a'],
    ['--', '--'],
    ['-a', '-a'],
    ['-', '\\-'],
    ['0a', '\\30 a'],
    ['9a', '\\39 a'],
    ['-0a', '-\\30 a'],
    ['-9', '-\\39 '],
    ['\0', '�'],
    ['a\0b', 'a�b'],
    ['\x01\x02\x1E\x1F', '\\1 \\2 \\1e \\1f '],
    ['\x7F', '\\7f '],
    ['\x80\x2D\x5F\xA9', '\x80\x2D\x5F\xA9'],
    ['𝌆', '𝌆'],
    ['\uDF06', '\uDF06'],
    ['héllo', 'héllo'],
    [' !xy', '\\ \\!xy'],
    ['md:flex', 'md\\:flex'],
    ['w-1/2', 'w-1\\/2'],
    ['#id.class', '\\#id\\.class'],
    ['a"b\\c', 'a\\"b\\\\c'],
    ['[x]', '\\[x\\]'],
  ])('%j → %j', (input, expected) => {
    expect(cssEscapeIdent(input)).toBe(expected);
  });
});

describe('REQ-PICK-004 cssAttrValue quotes an attribute value as a CSS string', () => {
  it.each([
    ['', '""'],
    ['save', '"save"'],
    ['Delete customer', '"Delete customer"'],
    ['say "hi"', '"say \\"hi\\""'],
    ['a\\b', '"a\\\\b"'],
    ["it's", '"it\'s"'],
    ['\0', '"�"'],
    ['line\nbreak', '"line\\a break"'],
    ['\x7F', '"\\7f "'],
    ['héllo ✓ 0', '"héllo ✓ 0"'],
  ])('%j → %j', (input, expected) => {
    expect(cssAttrValue(input)).toBe(expected);
  });
});
