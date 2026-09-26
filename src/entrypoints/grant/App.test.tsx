import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import type { OriginPattern } from '@/core/url/origin';
import { grantPageUrl } from '@/platform/grant-page';
import { fakes } from '../../../tests/fakes/install';
import { GrantApp } from './App';

const PROD = 'https://prod.example.com/*' as OriginPattern;
const ANY = '*://*.example.org/*' as OriginPattern;

const searchFor = (...origins: OriginPattern[]) => new URL(grantPageUrl(origins)).search;
const allow = () => screen.getByRole('button', { name: 'Allow' });

describe('REQ-PRIV-002 REQ-PICK-006 the grant page asks for the sites in its link', () => {
  it('names the sites it asks for', () => {
    render(<GrantApp search={searchFor(PROD, ANY)} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Allow SiteMark on these sites' }),
    ).toBeInTheDocument();
    const sites = within(screen.getByRole('list', { name: 'Sites' })).getAllByRole('listitem');
    expect(sites.map((site) => site.textContent)).toEqual([PROD, ANY]);
    expect(fakes().permissions.requests).toEqual([]);
  });

  it('prompts first and synchronously in the Allow click, then confirms the grant (D-229)', async () => {
    render(<GrantApp search={searchFor(PROD, ANY)} />);
    fireEvent.click(allow());
    expect(fakes().permissions.requests).toEqual([[PROD, ANY]]);
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Access granted. You can close this tab.',
    );
    expect(fakes().permissions.granted).toEqual([PROD, ANY]);
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
  });

  it('says so when the user declines, and lets them try again', async () => {
    fakes().permissions.answerNextRequest('deny');
    render(<GrantApp search={searchFor(PROD)} />);
    fireEvent.click(allow());
    expect(await screen.findByRole('status')).toHaveTextContent(
      "Access was not granted. Your marks won't show on these sites until you allow it.",
    );
    fireEvent.click(allow());
    expect(await screen.findByRole('status')).toHaveTextContent('Access granted.');
  });

  it('says so when the browser cannot prompt', async () => {
    vi.spyOn(browser.permissions, 'request').mockRejectedValueOnce(new Error('no gesture'));
    render(<GrantApp search={searchFor(PROD)} />);
    fireEvent.click(allow());
    expect(await screen.findByRole('status')).toHaveTextContent(
      "SiteMark couldn't ask for access. Please try again.",
    );
    expect(allow()).toBeEnabled();
  });

  it('refuses a link with anything but valid origins, without an Allow button', () => {
    render(<GrantApp search={`?origins=${encodeURIComponent(`${PROD},<all_urls>`)}`} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This link doesn't name a valid site. Open it again from SiteMark.",
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
