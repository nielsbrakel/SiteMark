import { describe, expect, it } from 'vitest';
import { slimCatalog } from './slim-catalogs';

describe('REQ-WEB-007 the language chunks carry only what the translator uses', () => {
  it('keeps messages and placeholder content, drops descriptions and examples', () => {
    const slim = slimCatalog({
      plain: { message: 'Hello', description: 'A greeting for translators' },
      named: {
        message: '$COUNT$ site groups',
        description: 'Shown in the list',
        placeholders: { count: { content: '$1', example: '3' } },
      },
    });
    expect(slim).toEqual({
      plain: { message: 'Hello' },
      named: { message: '$COUNT$ site groups', placeholders: { count: { content: '$1' } } },
    });
  });
});

describe('REQ-WEB-007 only the extension messages the website shows ship', () => {
  it('keeps just the listed keys when a filter is given', () => {
    const slim = slimCatalog({ a: { message: 'A' }, b: { message: 'B' } }, (key) => key === 'b');
    expect(slim).toEqual({ b: { message: 'B' } });
  });
});
