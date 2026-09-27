import { type ByRoleMatcher, type ByRoleOptions, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';

// Testing Library queries that fail as assertions. A red test may only fail on an expectation or a
// NotImplementedError (docs/testing.md), and getBy*/findBy* throw their own error type, so tests
// that drive a page whose new parts don't exist yet look elements up with these.

/** Like `getByRole`, but a missing element fails the test as an assertion. */
export function byRole(
  role: ByRoleMatcher,
  options?: ByRoleOptions,
  container: HTMLElement = document.body,
): HTMLElement {
  const element = within(container).queryByRole(role, options);
  expect(element, `role ${String(role)} named ${String(options?.name ?? '(any)')}`).not.toBeNull();
  return element as HTMLElement;
}

/** Like `findByRole`: waits for the element, then fails as an assertion. */
export async function findRole(
  role: ByRoleMatcher,
  options?: ByRoleOptions,
  container: HTMLElement = document.body,
): Promise<HTMLElement> {
  await waitFor(() => byRole(role, options, container));
  return byRole(role, options, container);
}

/** Like `getByLabelText` for a form control. */
export function byLabel(label: string, container: HTMLElement = document.body): HTMLElement {
  const element = within(container).queryByLabelText(label);
  expect(element, `control labelled ${label}`).not.toBeNull();
  return element as HTMLElement;
}
