import type { WebsiteMessageKey } from '../i18n/website-t';
import styles from '../pages/HomePage.module.css';
import type { PageProps } from '../pages/page-props';

export type CardItem = { icon: string; title: WebsiteMessageKey; text: WebsiteMessageKey };

/** Cards with a small inline icon (an SVG path), a title and a text. */
export function CardList({ items, t }: { items: readonly CardItem[] } & Pick<PageProps, 't'>) {
  return (
    <ul className={styles.cards}>
      {items.map(({ icon, title, text }) => (
        <li key={title} className={`sm-card ${styles.card}`}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            width="28"
            height="28"
            aria-hidden="true"
          >
            <path d={icon} />
          </svg>
          <h3>{t(title)}</h3>
          <p>{t(text)}</p>
        </li>
      ))}
    </ul>
  );
}
