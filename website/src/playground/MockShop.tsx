import type { ReactNode } from 'react';
import styles from './MockShop.module.css';

type Props = { readonly brand: string; readonly button: ReactNode };

const PRODUCTS = [1, 2, 3] as const;

/**
 * The sample page in the mock browser: a generic web shop (header, hero, three products), drawn
 * from plain shapes so it looks like a real site without copying any. It is decorative; `button` is
 * the element the playground's element mark marks.
 */
export function MockShop({ brand, button }: Props) {
  return (
    <div className={styles.shop}>
      <div className={styles.bar}>
        <span className={styles.logo} />
        <span className={styles.brand}>{brand}</span>
        <span className={styles.links}>
          <span className={styles.link} />
          <span className={styles.link} />
          <span className={styles.link} />
        </span>
        <span className={styles.cart} />
      </div>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.headline} />
          <span className={styles.headlineShort} />
          {button}
        </div>
        <span className={styles.picture} />
      </div>
      <div className={styles.products}>
        {PRODUCTS.map((product) => (
          <div key={product} className={styles.product}>
            <span className={styles.thumb} />
            <span className={styles.name} />
            <span className={styles.price} />
          </div>
        ))}
      </div>
    </div>
  );
}
