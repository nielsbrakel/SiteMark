import type { ReactNode } from 'react';
import styles from './Wordmark.module.css';
import { LETTERING } from './wordmark-lettering';

/** The strokes of the window: the wordmark's, and the heavier ones that survive at toolbar size. */
const STROKES = {
  light: { bar: 6, ribbon: 6, frame: 7 },
  heavy: { bar: 8, ribbon: 8, frame: 9 },
} as const;

// The window is 96 × 88 at (16, 20). Inline, not an <img>: Firefox shares one document per cached
// SVG image, so an animation inside it played on the first page only. Here it starts with every
// page. The colors follow the theme through CSS (design/logo has the standalone files).
function Window({ heavy }: { heavy?: boolean }): ReactNode {
  const stroke = heavy ? STROKES.heavy : STROKES.light;
  return (
    <g className={styles.win}>
      <defs>
        <clipPath id="sitemark-window">
          <rect x="16" y="20" width="96" height="88" rx="12" />
        </clipPath>
      </defs>
      <rect className={styles.edge} x="16" y="20" width="96" height="88" rx="12" strokeWidth="14" />
      <rect className={styles.face} x="16" y="20" width="96" height="88" rx="12" />
      <path className={styles.ink} d="M16 46H112" strokeWidth={stroke.bar} />
      <circle className={styles.dot} cx="30" cy="33" r={heavy ? 4.5 : 3.6} />
      <g clipPath="url(#sitemark-window)">
        <path className={styles.rib} d="M44 10L84 10L124 50L124 90Z" strokeWidth={stroke.ribbon} />
      </g>
      <rect
        className={styles.frame}
        x="16"
        y="20"
        width="96"
        height="88"
        rx="12"
        strokeWidth={stroke.frame}
      />
    </g>
  );
}

type LogoProps = { readonly size: number };

/** The window logo, drawn once as it appears. Decorative: the page heading names it. */
export function Logo({ size }: LogoProps): ReactNode {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 128 128"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <Window heavy />
    </svg>
  );
}

type WordmarkProps = { readonly label?: string };

/**
 * The window logo and the lettering, 510 × 128 so the width and height keep the header from
 * shifting. Decorative without a label: the page heading names it.
 */
export function Wordmark({ label }: WordmarkProps): ReactNode {
  return (
    <svg
      className={styles.logo}
      viewBox="10 0 510 128"
      width={175}
      height={44}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g transform="translate(4 8) scale(.88)">
        <Window />
      </g>
      <g transform="translate(0 9)">
        <path className={styles.site} d={LETTERING.site} />
        <path className={styles.mark} d={LETTERING.mark} />
      </g>
    </svg>
  );
}
