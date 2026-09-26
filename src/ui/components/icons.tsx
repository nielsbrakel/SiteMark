import type { ReactNode } from 'react';

// Inline SVG icons (no icon font, no network: design.md §1). Decorative: whoever renders one names
// the control, so the icons are aria-hidden and take the text color.

type IconProps = { readonly className?: string | undefined };

function Icon({ className, children }: IconProps & { readonly children: ReactNode }) {
  return (
    <svg
      className={className}
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
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M3 8.5l3.2 3L13 4.5" />
    </Icon>
  );
}

export function WarningIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M8 1.8L15 14H1z" />
      <path d="M8 6.5v3.2M8 11.8v.2" />
    </Icon>
  );
}
