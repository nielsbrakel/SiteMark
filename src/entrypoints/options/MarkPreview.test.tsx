import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { anElementMark, aPageMark, aSiteGroup, aState } from '@/core/testing/builders';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

async function openMark(group: SiteGroup, markId: string) {
  optionsBackground(aState({ siteGroups: [group] }));
  atHash(`#/groups/${group.id}/marks/${markId}`);
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return view.container;
}

const preview = () => byRole('figure', { name: 'Preview' });
/** The marks are drawn in the preview's shadow root by the shared marker views. */
const drawn = () => {
  const root = preview().querySelector('[data-marker-host]')?.shadowRoot;
  expect(root, 'the preview has an open shadow root').toBeTruthy();
  return root as ShadowRoot;
};

beforeEach(() => atHash(''));

describe('REQ-MARK-013 the mark editor previews the mark on a mock browser window', () => {
  it('draws the mark with the shared marker views on a mock page', async () => {
    const ribbon = aPageMark({ effects: { ribbon: { text: 'PROD', corner: 'top-right' } } });
    await openMark(aSiteGroup({ marks: [ribbon] }), ribbon.id);
    expect(preview()).toHaveTextContent('Example page');
    expect(preview()).toHaveTextContent('example.com');
    expect(drawn().textContent).toContain('PROD');
  });

  it('follows the mark as it is edited', async () => {
    const ribbon = aPageMark({ effects: { ribbon: { text: 'PROD', corner: 'top-right' } } });
    await openMark(aSiteGroup({ marks: [ribbon] }), ribbon.id);
    fireEvent.change(byLabel('Ribbon text'), { target: { value: 'LIVE' } });
    fireEvent.blur(byLabel('Ribbon text'));
    await waitFor(() => expect(drawn().textContent).toContain('LIVE'));
    expect(drawn().textContent).not.toContain('PROD');
  });

  it('shows the title prefix in the mock tab', async () => {
    const titled = aPageMark({
      effects: { ribbon: { text: 'PROD', corner: 'top-left' }, titlePrefix: { text: 'STAGE' } },
    });
    await openMark(aSiteGroup({ marks: [titled] }), titled.id);
    expect(preview()).toHaveTextContent('STAGE Example page');
  });

  it('draws an element mark on the mock page’s element', async () => {
    const outline = anElementMark();
    await openMark(aSiteGroup({ marks: [outline] }), outline.id);
    expect(drawn().querySelector('.sm-outline')).not.toBeNull();
  });

  it('previews a mark even when its site group is turned off', async () => {
    const ribbon = aPageMark({ effects: { ribbon: { text: 'OFF', corner: 'top-right' } } });
    await openMark(aSiteGroup({ enabled: false, patterns: [], marks: [ribbon] }), ribbon.id);
    expect(drawn().textContent).toContain('OFF');
  });

  it('has no axe violations', async () => {
    const ribbon = aPageMark();
    const container = await openMark(aSiteGroup({ marks: [ribbon] }), ribbon.id);
    preview();
    expect(await axeViolations(container)).toEqual([]);
  });
});
