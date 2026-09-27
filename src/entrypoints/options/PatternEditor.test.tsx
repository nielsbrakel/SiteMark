import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
import type { OriginPattern } from '@/core/url/origin';
import { fakes } from '../../../tests/fakes/install';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const wildcard = aWildcardPattern({ value: 'https://prod.example.com/*' });
const regex = aRegexPattern({
  value: '^https://admin\\.example\\.com/',
  origins: ['https://admin.example.com/*' as OriginPattern],
});
const prod = aSiteGroup({ name: 'Production', patterns: [wildcard, regex] });

async function openGroup(group: SiteGroup = prod) {
  const background = optionsBackground(aState({ siteGroups: [group] }));
  atHash(`#/groups/${group.id}`);
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return { background, container: view.container };
}

const patternList = () => byRole('list', { name: 'URL patterns' });
const patternTexts = () =>
  within(patternList())
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('code')?.textContent);
const patternInput = () => byLabel('URL pattern');
const addButton = () => byRole('button', { name: 'Add pattern' });

function type(control: HTMLElement, value: string) {
  fireEvent.change(control, { target: { value } });
}

function chooseRegex() {
  fireEvent.click(
    byRole('radio', { name: 'Regex' }, byRole('radiogroup', { name: 'Pattern type' })),
  );
}

beforeEach(() => atHash(''));

describe('REQ-OPT-002 the site group editor lists its URL patterns', () => {
  it('shows each pattern, and the origins a regex runs on', async () => {
    await openGroup();
    expect(patternTexts()).toEqual([
      'https://prod.example.com/*',
      '^https://admin\\.example\\.com/',
    ]);
    const [, regexItem] = within(patternList()).getAllByRole('listitem');
    expect(regexItem).toHaveTextContent('https://admin.example.com/*');
  });
});

describe('REQ-OPT-002 REQ-URL-003 patterns are added with an explicit Add', () => {
  it("asks for the pattern's site first and synchronously, then adds it (D-229)", async () => {
    const { background } = await openGroup();
    type(patternInput(), 'staging.example.com');
    expect(background.commands).toEqual([]);
    fireEvent.click(addButton());
    expect(fakes().permissions.requests).toEqual([['*://staging.example.com/*']]);
    await waitFor(() => expect(patternTexts()).toContain('*://staging.example.com/*'));
    expect(background.commands).toEqual([
      {
        type: 'addPattern',
        groupId: prod.id,
        draft: { kind: 'wildcard', value: 'staging.example.com' },
      },
    ]);
    expect(patternInput()).toHaveValue('');
  });

  it('adds the pattern even when the user declines the prompt', async () => {
    fakes().permissions.answerNextRequest('deny');
    await openGroup();
    type(patternInput(), 'staging.example.com');
    fireEvent.click(addButton());
    await waitFor(() => expect(patternTexts()).toContain('*://staging.example.com/*'));
  });

  it('shows why an invalid pattern is refused, and asks and sends nothing', async () => {
    const { background } = await openGroup();
    type(patternInput(), 'https://ex*ample.com');
    fireEvent.click(addButton());
    expect(patternInput()).toHaveAccessibleDescription(
      expect.stringContaining('A wildcard is only allowed at the start of the host.'),
    );
    expect(patternInput()).toHaveAttribute('aria-invalid', 'true');
    expect(patternInput()).toHaveValue('https://ex*ample.com');
    expect(fakes().permissions.requests).toEqual([]);
    expect(background.commands).toEqual([]);
  });

  it('shows why the background refused a pattern', async () => {
    const { background } = await openGroup();
    background.refuseNext('patternLimitReached');
    type(patternInput(), 'staging.example.com');
    fireEvent.click(addButton());
    await waitFor(() =>
      expect(patternInput()).toHaveAccessibleDescription(
        expect.stringContaining('A site group can have at most 50 URL patterns.'),
      ),
    );
  });
});

describe('REQ-URL-009 broad patterns are rejected', () => {
  it.each(['*.com', '*://*/*', '<all_urls>', '*.co.uk'])('rejects %s', async (value) => {
    const { background } = await openGroup();
    type(patternInput(), value);
    fireEvent.click(addButton());
    expect(patternInput()).toHaveAccessibleDescription(
      expect.stringContaining('This pattern matches too many sites.'),
    );
    expect(background.commands).toEqual([]);
  });
});

describe('REQ-URL-004 regex patterns run on explicit origins', () => {
  const origins = () => byLabel('Origins');

  it('adds a regex with its origins, asking for those origins first', async () => {
    const { background } = await openGroup(aSiteGroup({ enabled: false, patterns: [] }));
    chooseRegex();
    type(patternInput(), '^https://shop\\.example\\.com/admin/');
    type(origins(), 'https://shop.example.com, http://shop.example.com');
    fireEvent.click(addButton());
    expect(fakes().permissions.requests).toEqual([
      ['https://shop.example.com/*', 'http://shop.example.com/*'],
    ]);
    await waitFor(() => expect(patternTexts()).toEqual(['^https://shop\\.example\\.com/admin/']));
    expect(background.commands.at(-1)).toMatchObject({
      type: 'addPattern',
      draft: {
        kind: 'regex',
        value: '^https://shop\\.example\\.com/admin/',
        origins: ['https://shop.example.com', 'http://shop.example.com'],
      },
    });
  });

  it('shows why an unsafe regex is refused', async () => {
    await openGroup();
    chooseRegex();
    type(patternInput(), '(a+)+$');
    type(origins(), 'https://shop.example.com');
    fireEvent.click(addButton());
    expect(patternInput()).toHaveAccessibleDescription(expect.stringContaining('Not allowed:'));
    expect(fakes().permissions.requests).toEqual([]);
  });

  it.each([
    ['', 'Add at least one origin'],
    ['*.com', 'This pattern matches too many sites.'],
  ])('shows why the origins %j are refused, next to them', async (value, reason) => {
    const { background } = await openGroup();
    chooseRegex();
    type(patternInput(), '^https://shop\\.example\\.com/');
    type(origins(), value);
    fireEvent.click(addButton());
    expect(origins()).toHaveAccessibleDescription(expect.stringContaining(reason));
    expect(background.commands).toEqual([]);
  });
});

describe('REQ-GRP-002 removing URL patterns', () => {
  const remove = (value: string) => byRole('button', { name: `Remove “${value}”` }, patternList());

  it('removes a pattern', async () => {
    const { background } = await openGroup();
    fireEvent.click(remove('https://prod.example.com/*'));
    await waitFor(() => expect(patternTexts()).toEqual(['^https://admin\\.example\\.com/']));
    expect(background.commands).toEqual([
      { type: 'removePattern', groupId: prod.id, patternId: wildcard.id },
    ]);
  });

  it('turns the site group off with a notice when its last pattern goes', async () => {
    const single = aSiteGroup({ name: 'Single', patterns: [aWildcardPattern()] });
    await openGroup(single);
    fireEvent.click(remove('https://prod.example.com/*'));
    expect(await findRole('status')).toHaveTextContent(
      '“Single” was turned off because it has no URL patterns left.',
    );
    await waitFor(() =>
      expect(byRole('switch', { name: 'Enabled' })).toHaveAttribute('aria-checked', 'false'),
    );
  });

  it('has no axe violations', async () => {
    const { container } = await openGroup();
    patternList();
    expect(await axeViolations(container)).toEqual([]);
  });
});
