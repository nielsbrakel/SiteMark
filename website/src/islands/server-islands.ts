import { HeroPlayground } from '../playground/HeroPlayground';
import { Playground } from '../playground/Playground';
import { ThemeToggle } from '../theme/ThemeToggle';
import type { IslandComponent, IslandId } from './islands';

/** Every island's component, for prerendering (only entry-server.tsx imports this module). */
export function serverIslands(): Readonly<Record<IslandId, IslandComponent>> {
  return { themeToggle: ThemeToggle, playground: Playground, heroPlayground: HeroPlayground };
}
