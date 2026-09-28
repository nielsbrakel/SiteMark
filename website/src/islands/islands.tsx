import { createContext, type ReactNode, useContext } from 'react';
import { ThemeToggle } from '../theme/ThemeToggle';
import styles from './Island.module.css';
import type { IslandProps } from './island-props';

export type IslandId = 'themeToggle' | 'playground';
export type IslandComponent = (props: IslandProps) => ReactNode;
export type IslandComponents = Readonly<Partial<Record<IslandId, IslandComponent>>>;

// The interactive parts of the website (REQ-WEB-002). Everything else is static HTML: the browser
// never renders it, so page content costs no JavaScript (REQ-WEB-007). Page code imports no island
// but the theme toggle: the server provides the others (server-islands.ts), and the browser loads
// each one's code on demand (island-loaders.ts), so only a page with a playground loads it.

/** The components `<Island>` renders; entry-server.tsx provides all of them. */
export const IslandComponentsContext = createContext<IslandComponents>({
  themeToggle: ThemeToggle,
});

/** Renders an island inside its hydration root, `<div data-island="<id>">`, which layout ignores. */
export function Island({ id, t }: IslandProps & { id: IslandId }) {
  const Component = useContext(IslandComponentsContext)[id];
  if (!Component) throw new Error(`No component is provided for the island ${id}`);
  return (
    <div className={styles.island} data-island={id}>
      <Component t={t} />
    </div>
  );
}
