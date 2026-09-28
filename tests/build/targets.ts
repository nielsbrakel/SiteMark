import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Edge is a Chromium browser with its own store zip (`wxt build -b edge`, D-241). */
export type Target = 'chrome' | 'edge' | 'firefox' | 'safari';
export const ALL_TARGETS: Target[] = ['chrome', 'edge', 'firefox', 'safari'];

/** Targets under test: `SITEMARK_TARGETS=chrome,firefox`, or all four. CI passes its matrix entry. */
export function targets(): Target[] {
  const selected = process.env.SITEMARK_TARGETS?.split(',').filter(Boolean) as Target[] | undefined;
  return selected?.length ? selected : ALL_TARGETS;
}

/** The production output directory of a target. Fails loudly when it wasn't built. */
export function outDir(target: Target): string {
  const dir = path.resolve('.output', `${target}-mv3`);
  if (!existsSync(dir)) throw new Error(`${dir} is missing: run \`pnpm build:all\` first.`);
  return dir;
}

export function readManifest(target: Target): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(outDir(target), 'manifest.json'), 'utf8'));
}
