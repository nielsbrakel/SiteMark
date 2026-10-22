import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Keys } from './Keys';

const caps = (shortcut: string) =>
  [...render(<Keys shortcut={shortcut} />).container.querySelectorAll('kbd')].map(
    (key) => key.textContent,
  );

describe('REQ-POP-008 REQ-OPT-008 a keyboard shortcut is shown as key caps', () => {
  it('shows one cap per key of a shortcut written with plus signs', () => {
    expect(caps('Ctrl+Shift+H')).toEqual(['Ctrl', 'Shift', 'H']);
  });

  it('shows one cap per symbol of a macOS shortcut', () => {
    expect(caps('⌥⇧M')).toEqual(['⌥', '⇧', 'M']);
  });
});
