import { type KeyboardEvent, useId, useRef } from 'react';

/**
 * Roving focus in a radio group (WAI-ARIA APG): the option an arrow, Home or End key moves to,
 * wrapping around; `undefined` for any other key.
 */
function rovingIndex(key: string, index: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

/** Only the selected option is in the tab order; the first one when nothing is selected. */
function rovingTabIndex(index: number, selectedIndex: number): 0 | -1 {
  return index === Math.max(selectedIndex, 0) ? 0 : -1;
}

type RovingFocus = {
  readonly ref: (index: number) => (element: HTMLElement | null) => void;
  readonly onKeyDown: (index: number) => (event: KeyboardEvent) => void;
};

/** Arrow keys select the next or previous option of a radio group and move focus to it. */
function useRovingFocus(
  count: number,
  select: (index: number) => void,
  isDisabled = false,
): RovingFocus {
  const items = useRef<(HTMLElement | null)[]>([]);
  return {
    ref: (index) => (element) => {
      items.current[index] = element;
    },
    onKeyDown: (index) => (event) => {
      const next = isDisabled ? undefined : rovingIndex(event.key, index, count);
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      items.current[next]?.focus();
    },
  };
}

/** What each radio button of a group spreads onto its `<button>`. */
type RadioProps = {
  readonly ref: (element: HTMLElement | null) => void;
  readonly type: 'button';
  readonly role: 'radio';
  readonly 'aria-checked': boolean;
  readonly tabIndex: 0 | -1;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
};

/** The label id and per-option props of a radio group with roving focus (WAI-ARIA APG). */
export function useRadioGroup(
  count: number,
  selectedIndex: number,
  onSelect: (index: number) => void,
  disabled: boolean,
): { readonly labelId: string; readonly radio: (index: number) => RadioProps } {
  const labelId = useId();
  const roving = useRovingFocus(count, onSelect, disabled);
  return {
    labelId,
    radio: (index) => ({
      ref: roving.ref(index),
      type: 'button',
      role: 'radio',
      'aria-checked': index === selectedIndex,
      tabIndex: rovingTabIndex(index, selectedIndex),
      disabled,
      onClick: () => onSelect(index),
      onKeyDown: roving.onKeyDown(index),
    }),
  };
}
