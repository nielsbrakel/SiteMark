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

export function CloseIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
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

export function SunIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z" />
    </Icon>
  );
}

/** A screen: follow the system. */
export function SystemIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <rect x="1.8" y="2.8" width="12.4" height="8.4" rx="1.4" />
      <path d="M5.5 14h5" />
    </Icon>
  );
}
