import type { ReactNode } from 'react';
import light from '@/assets/wordmark.svg';
import dark from '@/assets/wordmark-dark.svg';
import styles from './Wordmark.module.css';

// The SVG is 510 × 128 (design/logo); the width and height keep the header from shifting.
const SIZE = { width: 175, height: 44 };

/** The SiteMark wordmark in the colors of the current theme. Decorative: the page heading names it. */
export function Wordmark(): ReactNode {
  return (
    <span className={styles.wordmark}>
      <img className={styles.light} src={light} alt="" {...SIZE} />
      <img className={styles.dark} src={dark} alt="" {...SIZE} />
    </span>
  );
}
