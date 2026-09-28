import { ThemeToggle } from '../theme/ThemeToggle';
import type { IslandComponent, IslandId } from './islands';

// How the browser gets each island's code (REQ-WEB-007): the theme toggle is on every page, so it
// is part of the client entry; the playground (compose, the URL engine, the core schemas and the
// marker views) is a chunk of its own that only pages with a playground load.
const LOADERS: Record<IslandId, () => Promise<IslandComponent>> = {
  themeToggle: () => Promise.resolve(ThemeToggle),
  playground: async () => (await import('../playground/Playground')).Playground,
};

/** Loads the component of an island, or undefined for anything that isn't an island ID. */
export function loadIsland(id: string): Promise<IslandComponent> | undefined {
  return Object.hasOwn(LOADERS, id) ? LOADERS[id as IslandId]() : undefined;
}
