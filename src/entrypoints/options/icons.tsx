import type { ReactNode } from 'react';

// Inline SVG icons of the options page (design.md §1: no icon font, no network). Decorative: the
// button that shows one carries the name.

function Icon({ path }: { readonly path: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}

export function ArrowUpIcon(): ReactNode {
  return <Icon path="M8 13V3M4 7l4-4 4 4" />;
}

export function ArrowDownIcon(): ReactNode {
  return <Icon path="M8 3v10M4 9l4 4 4-4" />;
}
