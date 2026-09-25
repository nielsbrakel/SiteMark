import { screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { mount } from './mount';

afterEach(() => document.body.replaceChildren());

describe('REQ-I18N-004 mount() renders a page with its locale applied', () => {
  it('renders into #root and sets lang and dir', () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);
    act(() => {
      mount(<h1>{'x'}</h1>);
    });
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('fails loudly without a #root element', () => {
    expect(() => mount(<p />)).toThrow(/missing #root/);
  });
});
