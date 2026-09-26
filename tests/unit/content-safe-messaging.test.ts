import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Content scripts import the messaging helpers, so these must not pull in the background's code:
// zod, the URL engine (regexpp) or compose would blow the marker's size budget (≤ 25 KB gzip).
// Type-only imports are erased by the build and don't count.

const CONTENT_SAFE = [
  'src/app/protocol.ts',
  'src/core/render/render-plan.ts',
  'src/platform/send-message.ts',
  'src/platform/listen-in-tab.ts',
  'src/platform/message-senders.ts',
];

const BACKGROUND_ONLY = [/zod/, /regexpp/, /\/core\/url\//, /\/core\/model\//, /compose/];

const RUNTIME_IMPORT = /^import\s+(?!type\b)(?:[^;]*?\s+from\s+)?'([^']+)';/gm;

function resolve(from: string, specifier: string): string {
  if (!specifier.startsWith('.')) return specifier;
  const base = path.join(path.dirname(from), specifier);
  return [`${base}.ts`, `${base}/index.ts`].find((file) => existsSync(file)) ?? base;
}

/** Every module `file` loads at runtime, directly or through other modules. */
function runtimeGraph(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file) || !file.endsWith('.ts')) return seen.add(file);
  seen.add(file);
  for (const [, specifier = ''] of readFileSync(file, 'utf8').matchAll(RUNTIME_IMPORT)) {
    runtimeGraph(resolve(file, specifier), seen);
  }
  return seen;
}

describe('REQ-SEC-003 content scripts can use the protocol without the background code', () => {
  it.each(CONTENT_SAFE)('%s loads no zod, URL engine or compose', (file) => {
    const graph = [...runtimeGraph(file)];
    expect(graph.filter((module) => BACKGROUND_ONLY.some((ban) => ban.test(module)))).toEqual([]);
  });

  it('finds runtime imports, and only those', () => {
    const graph = runtimeGraph('src/platform/message-payloads.ts');
    expect([...graph].some((module) => /zod/.test(module))).toBe(true);
  });
});

describe('REQ-SEC-003 only the background router and the content listener take runtime messages', () => {
  it('registers runtime.onMessage in exactly two files', () => {
    const sources = globSync('src/**/*.{ts,tsx}').filter((file) => !/\.test\.tsx?$/.test(file));
    const listeners = sources.filter((file) =>
      /runtime\.onMessage\.addListener/.test(readFileSync(file, 'utf8')),
    );
    expect(listeners.sort()).toEqual([
      'src/platform/listen-in-tab.ts',
      'src/platform/messaging.ts',
    ]);
  });
});
