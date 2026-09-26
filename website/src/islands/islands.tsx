import type { ReactNode } from 'react';
import type { WebsiteTranslator } from '../i18n/website-t';
import { ThemeToggle } from '../theme/ThemeToggle';
import styles from './Island.module.css';

/** What an island gets, on the server and in the browser alike (so hydration matches). */
export type IslandProps = { t: WebsiteTranslator['t'] };

type IslandComponent = (props: IslandProps) => ReactNode;

// The interactive parts of the website (REQ-WEB-002). Everything else is static HTML: the browser
// never renders it, so page content costs no JavaScript (REQ-WEB-007). W2 adds the playground.
const ISLANDS = {
  themeToggle: ThemeToggle,
} satisfies Record<string, IslandComponent>;

type IslandId = keyof typeof ISLANDS;

/** The component of an island, or undefined for anything that isn't an island ID. */
export function islandFor(id: string): IslandComponent | undefined {
  return Object.hasOwn(ISLANDS, id) ? ISLANDS[id as IslandId] : undefined;
}

/** Renders an island inside its hydration root, `<div data-island="<id>">`, which layout ignores. */
export function Island({ id, t }: IslandProps & { id: IslandId }) {
  const Component = ISLANDS[id];
  return (
    <div className={styles.island} data-island={id}>
      <Component t={t} />
    </div>
  );
}
