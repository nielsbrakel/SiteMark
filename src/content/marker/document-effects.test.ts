import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aTitlePrefixItem } from '../../../tests/unit/document-items';
import { createDocumentEffects, type DocumentEffects } from './document-effects';

let effects: DocumentEffects | undefined;

/** Document effects that the test cleans up. */
function track(): DocumentEffects {
  effects = createDocumentEffects();
  return effects;
}

/** Lets the MutationObserver deliver the page's title change. */
async function pageSetsTitle(title: string): Promise<void> {
  document.title = title;
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  document.title = 'Customers';
});

afterEach(() => {
  effects?.dispose();
  effects = undefined;
  vi.useRealTimers();
});

describe('REQ-MARK-009 title prefix', () => {
  it('puts the trimmed prefix and one space before the title', () => {
    track().apply([aTitlePrefixItem('  [PROD]  ')]);
    expect(document.title).toBe('[PROD] Customers');
  });

  it('is idempotent: applying again, or to a title that already has it, changes nothing', () => {
    document.title = '[PROD] Customers';
    const effects = track();
    effects.apply([aTitlePrefixItem('[PROD]')]);
    effects.apply([aTitlePrefixItem('[PROD]')]);
    expect(document.title).toBe('[PROD] Customers');
  });

  it('only counts a prefix that is followed by a space (PROD is not in PRODUCTS)', () => {
    document.title = 'PRODUCTS';
    track().apply([aTitlePrefixItem('PROD')]);
    expect(document.title).toBe('PROD PRODUCTS');
  });

  it('uses the prefix alone on an empty title, without re-applying it forever', async () => {
    document.title = '';
    track().apply([aTitlePrefixItem('PROD')]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(document.title).toBe('PROD');
  });

  it('re-applies the prefix when the page changes its title', async () => {
    track().apply([aTitlePrefixItem('PROD')]);
    await pageSetsTitle('Orders');
    expect(document.title).toBe('PROD Orders');
  });

  it('re-applies when the page replaces its <title> element', async () => {
    track().apply([aTitlePrefixItem('PROD')]);
    const title = document.createElement('title');
    title.textContent = 'Invoices';
    document.querySelector('title')?.replaceWith(title);
    await vi.advanceTimersByTimeAsync(0);
    expect(document.title).toBe('PROD Invoices');
  });

  it('re-applies at most 4 times per second, then catches up with the latest title', async () => {
    track().apply([aTitlePrefixItem('PROD')]);
    for (const title of ['t1', 't2', 't3', 't4']) {
      await pageSetsTitle(title);
      expect(document.title).toBe(`PROD ${title}`);
    }
    await pageSetsTitle('t5');
    await pageSetsTitle('t6');
    expect(document.title).toBe('t6');
    await vi.advanceTimersByTimeAsync(1000);
    expect(document.title).toBe('PROD t6');
  });

  it('switches to a new prefix text', () => {
    const effects = track();
    effects.apply([aTitlePrefixItem('PROD')]);
    effects.apply([aTitlePrefixItem('TEST')]);
    expect(document.title).toBe('TEST Customers');
  });

  it('strips the prefix from the current title on removal, never restoring a stale one', async () => {
    const effects = track();
    effects.apply([aTitlePrefixItem('PROD')]);
    await pageSetsTitle('Orders');
    effects.clear();
    expect(document.title).toBe('Orders');
  });

  it('strips the prefix when a plan no longer has it', () => {
    const effects = track();
    effects.apply([aTitlePrefixItem('PROD')]);
    effects.apply([]);
    expect(document.title).toBe('Customers');
  });

  it('leaves a title alone on removal when it no longer starts with the prefix', () => {
    const effects = track();
    effects.apply([aTitlePrefixItem('PROD')]);
    document.title = 'Something else';
    effects.clear();
    expect(document.title).toBe('Something else');
  });

  it('stops re-applying after clear() and after dispose()', async () => {
    const effects = track();
    effects.apply([aTitlePrefixItem('PROD')]);
    effects.clear();
    await pageSetsTitle('Orders');
    expect(document.title).toBe('Orders');
    effects.apply([aTitlePrefixItem('PROD')]);
    effects.dispose();
    expect(document.title).toBe('Orders');
    await pageSetsTitle('Invoices');
    expect(document.title).toBe('Invoices');
  });
});
