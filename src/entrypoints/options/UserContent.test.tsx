import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildExport } from '@/core/data/export';
import type { SiteGroup } from '@/core/model/schema';
import {
  anElementMark,
  aPageMark,
  aRegexPattern,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '@/core/testing/builders';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

// User content is shown as typed (REQ-I18N-003): names that are message keys, or look like
// manifest placeholders, are never looked up, and page translators are told to leave them alone.

const asKey = aPageMark({
  label: 'optionsDelete',
  effects: { ribbon: { text: 'popupTitle', corner: 'top-right' } },
});
const bySelector = anElementMark({ target: { kind: 'element', selector: '#optionsEdit' } });
const named = aSiteGroup({
  name: 'popupMarkThisSite',
  patterns: [aWildcardPattern({ value: 'https://optionsTitle.example.com/*' })],
  marks: [asKey, bySelector],
});
const placeholder = aSiteGroup({ name: '__MSG_extName__', enabled: false, patterns: [] });

async function openAt(hash: string, siteGroups: SiteGroup[] = [named, placeholder]) {
  const background = optionsBackground(aState({ siteGroups }));
  atHash(hash);
  render(<OptionsApp />);
  await screen.findByRole('main');
  return background;
}

const sidebar = () => byRole('complementary', { name: 'Site groups' });
const pane = () => byRole('main');

/** Every element whose own text is exactly `text` is out of reach of page translators. */
function expectUntranslated(text: string, container: HTMLElement = document.body) {
  const elements = within(container).queryAllByText(text);
  expect(elements, text).not.toEqual([]);
  for (const element of elements) {
    expect(element.closest('[translate="no"]'), text).not.toBeNull();
  }
}

beforeEach(() => atHash(''));

describe('REQ-I18N-003 the options page shows user content as typed, never translated', () => {
  it('lists the site groups by their own names', async () => {
    await openAt(`#/groups/${named.id}`);
    const names = within(sidebar())
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(names).toEqual(['popupMarkThisSite', '__MSG_extName__']);
  });

  it('shows the group name, patterns, marks and texts literally in the editor', async () => {
    await openAt(`#/groups/${named.id}/marks/${asKey.id}`);
    expect(within(pane()).getByRole('heading', { level: 2 })).toHaveTextContent(
      /^popupMarkThisSite$/,
    );
    expect(byLabel('Name', pane())).toHaveValue('popupMarkThisSite');
    expect(pane()).toHaveTextContent('https://optionsTitle.example.com/*');
    const marks = within(byRole('list', { name: 'Marks' }))
      .getAllByRole('listitem')
      .map((item) => item.querySelector('[data-summary]')?.textContent);
    expect(marks).toEqual(['optionsDelete · Page · Ribbon', 'Element · #optionsEdit · Outline']);
    expect(byLabel('Ribbon text', pane())).toHaveValue('popupTitle');
  });

  it('keeps page translators away from names, patterns, labels and selectors', async () => {
    await openAt(`#/groups/${named.id}`);
    expectUntranslated('popupMarkThisSite', sidebar());
    expectUntranslated('__MSG_extName__', sidebar());
    expectUntranslated('popupMarkThisSite', pane());
    expectUntranslated('https://optionsTitle.example.com/*', pane());
    expectUntranslated('optionsDelete', pane());
    expectUntranslated('#optionsEdit', pane());
  });

  it('keeps page translators away from the regex patterns of an import preview', async () => {
    await openAt('#/data');
    const regex = aRegexPattern({ value: '^https://prod\\.example\\.com/popupTitle/' });
    const file = buildExport(aState({ siteGroups: [aSiteGroup({ patterns: [regex] })] }), {
      appVersion: '1.2.3',
      now: 0,
    }).json;
    fireEvent.change(byLabel('Choose an export file'), {
      target: { files: [new File([file], 'sitemark-export.json', { type: 'application/json' })] },
    });
    const section = () => byRole('region', { name: 'Import' });
    await waitFor(() => expect(section()).toHaveTextContent(regex.value));
    expectUntranslated(regex.value, section());
  });
});
