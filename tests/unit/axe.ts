import { configureAxe } from 'vitest-axe';

// REQ-A11Y-004 (component part): axe-core in happy-dom through vitest-axe's runner. Its matcher types
// target Vitest's old global `Vi` namespace, so tests assert on this list instead of using
// `toHaveNoViolations()`; an empty list means no violations, and a failure names rule and nodes.
// `region` is off because a component is checked on its own, outside any page landmarks.
const axe = configureAxe({ rules: { region: { enabled: false } } });

/** The axe violations in `container`, one line per rule: `id (impact): targets`. */
export async function axeViolations(container: Element): Promise<string[]> {
  const { violations } = await axe(container);
  return violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  );
}
