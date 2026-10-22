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

export function ArrowUpIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M8 13V3M4 7l4-4 4 4" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M8 3v10M4 9l4 4 4-4" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </Icon>
  );
}

export function BookIcon(props: IconProps): ReactNode {
  return (
    <Icon {...props}>
      <path d="M3 2.5h8.5a1.5 1.5 0 011.5 1.5v9.5H4.5A1.5 1.5 0 013 12zM3 12V2.5M6 5.5h4" />
    </Icon>
  );
}

/** The GitHub mark (Octicons, MIT): filled, unlike the stroked icons above. */
export function GitHubIcon(props: IconProps): ReactNode {
  return (
    <svg
      className={props.className}
      viewBox="0 0 16 16"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
